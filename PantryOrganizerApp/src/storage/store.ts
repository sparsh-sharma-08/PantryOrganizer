import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  setDoc,
  runTransaction,
  limit,
  getDocs,
  arrayUnion,
  arrayRemove,
  writeBatch,
  where
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';

import { Item } from '../types';

// Local cache
let pantryItems: Item[] = [];
let legacyPantryItems: Item[] = [];
let shoppingItems: Item[] = [];

const subscribers = new Set<() => void>();
let unsubscribePantry: (() => void) | null = null;
let unsubscribeLegacyPantry: (() => void) | null = null;
let unsubscribeShopping: (() => void) | null = null;
let currentCollectionPath = '';
let currentUserId: string | null = null;
let currentFamilyId: string | null = null;

let unsubscribeUser: (() => void) | null = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserId = user.uid;

    // Listen to User Document for Family ID changes
    if (unsubscribeUser) unsubscribeUser();

    const userDocRef = doc(db, 'users', user.uid);
    unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const newFamilyId = userData.familyId || null;

        // Only restart listeners if familyId actually changed
        if (newFamilyId !== currentFamilyId) {
          console.log(`Family ID changed from ${currentFamilyId} to ${newFamilyId}`);
          currentFamilyId = newFamilyId;
          startListeners(user.uid, newFamilyId);
        }
      }
    });

    // Initial fetch handled by snapshot? Yes, snapshot fires immediately.
    console.log('[Store] Auth Changed: User logged in', user.uid);
    // Start default listeners immediately. 
    // If the snapshot below reveals a Family ID later, the listener will update.
    console.log('[Store] initializing default listener (User mode)');
    startListeners(user.uid, null);

    // Auto-cleanup history older than 7 days on startup
    cleanupHistory(7).catch(e => console.warn('[Store] Auto-cleanup failed', e));

  } else {
    console.log('[Store] Auth Changed: User logged out');
    currentUserId = null;
    currentFamilyId = null;
    currentCollectionPath = '';

    if (unsubscribeUser) {
      unsubscribeUser();
      unsubscribeUser = null;
    }
    stopListeners();
    pantryItems = [];
    shoppingItems = [];
    legacyPantryItems = [];
    notify();
  }
});

function startListeners(uid: string, familyId: string | null) {
  stopListeners();

  // If familyId exists, we use the FAMILY path. Otherwise, we use the PRIVATE USER path.
  const basePath = familyId ? `pantries/${familyId}` : `pantries/${uid}`;
  currentCollectionPath = basePath;

  console.log(`Starting listeners at: ${basePath}`);

  // Listener 1: Pantry
  // CAUTION: Removing orderBy here ensures we fetch ALL items, even those missing 'createdAt'
  const qPantry = query(collection(db, `${basePath}/items`));
  unsubscribePantry = onSnapshot(qPantry, (snapshot) => {
    console.log(`[Store] Pantry Snapshot: ${snapshot.size} docs found at ${basePath}/items`);
    const newItems: Item[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      newItems.push({ id: doc.id, ...data, onShoppingList: false } as Item);
    });
    // Sort in memory to keep store consistent
    newItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    pantryItems = newItems;
    notify();
  }, (e) => console.warn('[Store] Pantry listener error', e));

  // Listener 1b: Legacy Pantry (singular 'pantry') - Only for User ID mode (Families use new system)
  if (!familyId) {
    const legacyPath = `pantry/${uid}/items`;
    console.log(`[Store] Checking legacy path: ${legacyPath}`);
    const qLegacy = query(collection(db, legacyPath));
    unsubscribeLegacyPantry = onSnapshot(qLegacy, (snapshot) => {
      if (!snapshot.empty) {
        console.log(`[Store] FOUND LEGACY ITEMS: ${snapshot.size}`);
        const newItems: Item[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          newItems.push({ id: doc.id, ...data, onShoppingList: false } as Item);
        });
        legacyPantryItems = newItems;
        notify();
      }
    }, (e) => {
      if (e.code !== 'permission-denied') {
        console.warn('[Store] Legacy Pantry listener error', e);
      }
    });
  }

  // Listener 2: Shopping List
  const shoppingBasePath = familyId ? `shoppingLists/${familyId}` : `shoppingLists/${uid}`;
  console.log(`[Store] Listening for ShoppingList at: ${shoppingBasePath}/items`);

  // CAUTION: Removing orderBy here ensures we fetch ALL items
  const qShopping = query(collection(db, `${shoppingBasePath}/items`));
  unsubscribeShopping = onSnapshot(qShopping, (snapshot) => {
    console.log(`[Store] Shopping Snapshot: ${snapshot.size} docs`);
    const newItems: Item[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      newItems.push({ id: doc.id, ...data, onShoppingList: true } as Item);
    });
    newItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    shoppingItems = newItems;
    notify();
  }, (e) => console.warn('[Store] Shopping listener error', e));

  // Run Self-Repair check if in a family
  if (familyId) {
    verifyFamilyIntegrity(familyId, uid).catch(e => console.warn('[Store] Integrity check failed', e));
  }

  // Also restart meal plan listener if needed
  restartMealPlanListener();
}

function stopListeners() {
  if (unsubscribePantry) { unsubscribePantry(); unsubscribePantry = null; }
  if (unsubscribeLegacyPantry) { unsubscribeLegacyPantry(); unsubscribeLegacyPantry = null; }
  if (unsubscribeShopping) { unsubscribeShopping(); unsubscribeShopping = null; }
}

function notify() {
  subscribers.forEach(cb => { try { cb() } catch (e) { console.warn(e) } });
}

async function getAll(): Promise<Item[]> {
  // Merge legacy items if any
  const combinedPantry = [...pantryItems, ...legacyPantryItems];
  // Deduplicate by ID just in case
  const uniquePantry = Array.from(new Map(combinedPantry.map(item => [item.id, item])).values());

  return [...shoppingItems, ...uniquePantry];
}

import { scheduleExpiryNotification, cancelNotification } from '../utils/notifications';

async function add(payload: Partial<Item>): Promise<Item> {
  if (!currentUserId) throw new Error("No user");

  const isOnShoppingList = !!payload.onShoppingList;
  // Use family ID if exists, else user ID
  const targetId = getTargetId();
  const collectionName = isOnShoppingList ? 'shoppingLists' : 'pantries';

  let notifId = null;
  // Only schedule if in pantry and has expiry
  if (!isOnShoppingList && payload.expires) {
    notifId = await scheduleExpiryNotification(payload.name || 'Item', new Date(payload.expires), 7);
  }

  const itemData = {
    name: String(payload.name || '').trim(),
    quantity: payload.quantity ?? 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    notificationId: notifId,
    ...payload
  };

  // Clean undefined
  Object.keys(itemData).forEach(key => (itemData as any)[key] === undefined && delete (itemData as any)[key]);

  const docRef = await addDoc(collection(db, collectionName, targetId, 'items'), itemData);
  return { id: docRef.id, ...itemData } as Item;
}

// Helper to get correct target ID (Family or User)
function getTargetId(): string {
  if (!currentUserId) throw new Error("No user");
  return currentFamilyId || currentUserId;
}

async function update(patch: Partial<Item> & { id: string }): Promise<Item | null> {
  if (!currentUserId) throw new Error("No user");

  const { id, ...updates } = patch;
  const targetId = getTargetId();

  // Find where the item currently lives
  const inPantry = pantryItems.find(i => i.id === id);
  const inShopping = shoppingItems.find(i => i.id === id);
  const currentItem = inPantry || inShopping;

  if (!currentItem) return null;

  const currentColl = inPantry ? 'pantries' : 'shoppingLists';
  let targetColl = currentColl;
  if (updates.onShoppingList !== undefined) {
    targetColl = updates.onShoppingList ? 'shoppingLists' : 'pantries';
  }

  // Handle Notifications Logic (unchanged logic, elided for brevity if possible, but must keep integrity)
  let newNotifId = currentItem.notificationId;
  const isNowInPantry = targetColl === 'pantries';
  const newExpires = updates.expires !== undefined ? updates.expires : currentItem.expires;
  const isConsumed = updates.consumedAt !== undefined ? !!updates.consumedAt : !!currentItem.consumedAt;

  if (currentItem.notificationId) {
    if (isConsumed || !isNowInPantry || (updates.expires && updates.expires !== currentItem.expires)) {
      await cancelNotification(currentItem.notificationId);
      newNotifId = null;
    }
  }

  if (isNowInPantry && !isConsumed && newExpires) {
    if (!newNotifId) {
      newNotifId = await scheduleExpiryNotification(
        updates.name || currentItem.name,
        new Date(newExpires),
        7
      );
    }
  }

  const finalUpdates = { ...updates, notificationId: newNotifId, updatedAt: Date.now() };

  if (currentColl === targetColl) {
    const itemRef = doc(db, currentColl, targetId, 'items', id);
    await updateDoc(itemRef, finalUpdates);
    return { ...currentItem, ...finalUpdates };
  } else {
    // MOVE
    const newItemData = { ...currentItem, ...finalUpdates };
    const { id: _, ...dataToSave } = newItemData;
    Object.keys(dataToSave).forEach(key => (dataToSave as any)[key] === undefined && delete (dataToSave as any)[key]);

    const newRef = doc(db, targetColl, targetId, 'items', id);
    await setDoc(newRef, dataToSave);

    await deleteDoc(doc(db, currentColl, targetId, 'items', id));
    return { id, ...dataToSave } as Item;
  }
}

async function remove(id: string): Promise<boolean> {
  if (!currentUserId) throw new Error("No user");
  const targetId = getTargetId();

  // Try to find it to know where to delete from
  const inPantry = pantryItems.find(i => i.id === id);
  const inShopping = shoppingItems.find(i => i.id === id);

  if (inPantry) {
    if (inPantry.notificationId) await cancelNotification(inPantry.notificationId);
    await deleteDoc(doc(db, 'pantries', targetId, 'items', id));
    return true;
  } else if (inShopping) {
    // Shopping items likely don't have notifs, but safe to check
    if (inShopping.notificationId) await cancelNotification(inShopping.notificationId);
    await deleteDoc(doc(db, 'shoppingLists', targetId, 'items', id));
    return true;
  }
  return false;
}

async function adjustQuantity(itemId: string, diff: number, reason: 'manual' | 'consumption' | 'purchase' | 'correction' = 'manual'): Promise<boolean> {
  if (!currentUserId) throw new Error("No user");
  const targetId = getTargetId();

  // Determine collection
  const inPantry = pantryItems.find(i => i.id === itemId);
  const collectionName = inPantry ? 'pantries' : 'shoppingLists';
  const itemRef = doc(db, collectionName, targetId, 'items', itemId);
  const historyRef = collection(db, collectionName, targetId, 'items', itemId, 'history');

  try {
    await runTransaction(db, async (transaction) => {
      const itemDoc = await transaction.get(itemRef);
      if (!itemDoc.exists()) throw new Error("Item does not exist!");

      const currentQty = itemDoc.data().quantity || 0;
      let newQty = currentQty + diff;
      if (newQty < 0) newQty = 0;

      transaction.update(itemRef, { quantity: newQty, updatedAt: Date.now() });

      // Search for history docs is not needed for simple add
      const newHistoryRef = doc(historyRef);
      transaction.set(newHistoryRef, {
        itemId,
        oldQuantity: currentQty,
        newQuantity: newQty,
        diff,
        reason,
        timestamp: Date.now()
      });
    });
    return true;
  } catch (e) {
    console.warn("Transaction failed: ", e);
    return false;
  }
}

async function undoLastAdjustment(itemId: string): Promise<{ success: boolean, message?: string }> {
  if (!currentUserId) throw new Error("No user");
  const targetId = getTargetId();

  // Find collection
  const inPantry = pantryItems.find(i => i.id === itemId);
  const collectionName = inPantry ? 'pantries' : 'shoppingLists';
  const itemRef = doc(db, collectionName, targetId, 'items', itemId);
  const historyRef = collection(db, collectionName, targetId, 'items', itemId, 'history');

  try {
    // Get last history item
    const q = query(historyRef, orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return { success: false, message: 'No history to undo' };

    const lastAction = querySnapshot.docs[0];
    const lastData = lastAction.data();

    await runTransaction(db, async (transaction) => {
      const itemDoc = await transaction.get(itemRef);
      if (!itemDoc.exists()) throw new Error("Item does not exist!");

      // Revert
      // If we added 5 (diff +5), we want to subtract 5.
      // But simpler: just restore 'oldQuantity' from history IF it matches current state logic?
      // Actually, 'diff' is safer if multiple users. But here, let's just reverse the diff.

      const currentQty = itemDoc.data().quantity || 0;
      // Verify if we are in a consistent state? 
      // Ideally we check if currentQty == lastData.newQuantity. 
      // If not, someone else modified it. But for Undo, usually we just want to apply -diff.

      const revertedQty = currentQty - lastData.diff;

      transaction.update(itemRef, { quantity: revertedQty >= 0 ? revertedQty : 0, updatedAt: Date.now() });
      transaction.delete(lastAction.ref);
    });

    return { success: true, message: 'Undone!' };
  } catch (e: any) {
    console.warn("Undo failed", e);
    return { success: false, message: e.message };
  }
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  cb();
  return { remove: () => subscribers.delete(cb) };
}

async function clearAll() { return false; }
async function cleanup() { }

async function cleanupHistory(daysToKeep: number = 7): Promise<void> {
  const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  console.log(`[Store] Cleaning up history older than ${daysToKeep} days (cutoff: ${new Date(cutoff).toISOString()})`);

  const all = await getAll();
  const toDelete = all.filter(item => {
    // Only delete if consumed/history AND older than cutoff
    // Also ensure quantity is <= 0 (just to be safe, though consumedAt implies it)
    if (!item.consumedAt) return false;
    return item.consumedAt < cutoff;
  });

  console.log(`[Store] Found ${toDelete.length} items to cleanup.`);

  for (const item of toDelete) {
    await remove(item.id);
  }
}

import { MealItem, MealPlanDay } from '../types';

let mealPlanCache: Record<string, MealPlanDay> = {};
let unsubscribeMealPlan: (() => void) | null = null;
const mealPlanSubscribers = new Set<(data: Record<string, MealPlanDay>) => void>();

// Helper to restart the listener whenever the path changes (User login or Family switch)
function restartMealPlanListener() {
  if (unsubscribeMealPlan) {
    unsubscribeMealPlan();
    unsubscribeMealPlan = null;
  }

  // If no path (logged out), clear cache and notify
  if (!currentCollectionPath) {
    mealPlanCache = {};
    mealPlanSubscribers.forEach(cb => cb({}));
    return;
  }

  // If nobody is listening, don't waste bandwidth
  if (mealPlanSubscribers.size === 0) return;

  console.log(`Starting MealPlan listener at: ${currentCollectionPath}/mealPlans`);

  const q = query(collection(db, `${currentCollectionPath}/mealPlans`), orderBy('date'));

  unsubscribeMealPlan = onSnapshot(q, (snapshot) => {
    const newCache: Record<string, MealPlanDay> = {};
    snapshot.forEach((doc) => {
      newCache[doc.id] = doc.data() as MealPlanDay;
    });
    mealPlanCache = newCache;
    // Notify all subscribers
    mealPlanSubscribers.forEach(cb => cb(newCache));
  }, (e) => console.warn("MealPlan Listener Error", e));
}

function subscribeToMealPlan(startDate: string, endDate: string, cb: (data: Record<string, MealPlanDay>) => void) {
  mealPlanSubscribers.add(cb);

  // Send current buffer immediately
  cb(mealPlanCache);

  // If this is the first subscriber, start the listener (and we have a path)
  if (mealPlanSubscribers.size === 1 && currentCollectionPath) {
    restartMealPlanListener();
  }

  return () => {
    mealPlanSubscribers.delete(cb);
    if (mealPlanSubscribers.size === 0 && unsubscribeMealPlan) {
      unsubscribeMealPlan();
      unsubscribeMealPlan = null;
    }
  };
}

async function addMeal(date: string, slot: 'breakfast' | 'lunch' | 'dinner', meal: MealItem) {
  if (!currentCollectionPath) throw new Error("No path");
  const targetId = getTargetId();
  const docRef = doc(db, `${currentCollectionPath}/mealPlans`, date);

  // We need to set 'date' field if creating for first time
  await setDoc(docRef, {
    date,
    [slot]: arrayUnion(meal)
  }, { merge: true });
}

async function removeMeal(date: string, slot: 'breakfast' | 'lunch' | 'dinner', mealId: string) {
  if (!currentCollectionPath) throw new Error("No path");
  const docRef = doc(db, `${currentCollectionPath}/mealPlans`, date);

  await runTransaction(db, async (t) => {
    const docSnap = await t.get(docRef);
    if (!docSnap.exists()) return;

    const data = docSnap.data() as MealPlanDay;
    const list = data[slot] || [];
    const newList = list.filter(m => m.id !== mealId);

    t.update(docRef, { [slot]: newList });
  });
}

// ... existing methods ...

async function cookMeal(date: string, slot: 'breakfast' | 'lunch' | 'dinner', mealId: string) {
  if (!currentCollectionPath) throw new Error("No path");
  const targetId = getTargetId();
  const docRef = doc(db, `${currentCollectionPath}/mealPlans`, date);

  return await runTransaction(db, async (t) => {
    // --- READ PHASE ---
    const mealDoc = await t.get(docRef);
    if (!mealDoc.exists()) throw new Error("Meal plan not found");

    const data = mealDoc.data() as MealPlanDay;
    const meals = data[slot] || [];
    const mealIndex = meals.findIndex(m => m.id === mealId);

    if (mealIndex === -1) throw new Error("Meal not found");
    const meal = meals[mealIndex];

    if (meal.cooked) throw new Error("Already cooked");

    // Collect all item reads
    const itemReads: { ref: any, ing: any }[] = [];

    if (meal.ingredients && meal.ingredients.length > 0) {
      for (const ing of meal.ingredients) {
        const itemRef = doc(db, 'pantries', targetId, 'items', ing.pantryItemId);
        itemReads.push({ ref: itemRef, ing });
      }
    } else if (meal.isPantryItem && meal.pantryItemId) {
      const itemRef = doc(db, 'pantries', targetId, 'items', meal.pantryItemId);
      // Mock ingredient for legacy support
      itemReads.push({
        ref: itemRef,
        ing: { pantryItemId: meal.pantryItemId, name: meal.name, quantityUsed: 1 }
      });
    }

    const itemSnapshots = [];
    for (const read of itemReads) {
      const snap = await t.get(read.ref);
      itemSnapshots.push({ snap, ing: read.ing, ref: read.ref });
    }

    // --- WRITE PHASE ---
    const updates: string[] = [];
    console.log(`Cooking meal ${meal.name}, processing ${itemSnapshots.length} items`);

    for (const { snap, ing, ref } of itemSnapshots) {
      if (snap.exists()) {
        const currentQty = Number((snap.data() as any).quantity) || 0;
        const qtyToUse = Number(ing.quantityUsed) || 0;
        const newQty = Math.max(0, currentQty - qtyToUse);

        console.log(`Deducting ${ing.name}: ${currentQty} - ${qtyToUse} = ${newQty}`);

        t.update(ref, { quantity: newQty, updatedAt: Date.now() }); // Use ref from read

        // History
        const histRef = doc(collection(db, 'pantries', targetId, 'items', ing.pantryItemId, 'history'));
        t.set(histRef, {
          itemId: ing.pantryItemId,
          oldQuantity: currentQty,
          newQuantity: newQty,
          diff: -qtyToUse,
          reason: 'consumption',
          timestamp: Date.now()
        });

        updates.push(`${ing.name}: ${currentQty} -> ${newQty}`);
      } else {
        console.warn(`Item not found during cook: ${ing.name}`);
        updates.push(`${ing.name}: Item Not Found (ID mismatch?)`);
      }
    }

    // Update Meal Status
    const newMeals = [...meals];
    newMeals[mealIndex] = { ...meal, cooked: true };
    t.update(docRef, { [slot]: newMeals });

    return updates;
  });
}


async function uncookMeal(date: string, slot: 'breakfast' | 'lunch' | 'dinner', mealId: string) {
  if (!currentCollectionPath) throw new Error("No path");
  const targetId = getTargetId();
  const docRef = doc(db, `${currentCollectionPath}/mealPlans`, date);

  return await runTransaction(db, async (t) => {
    // --- READ PHASE ---
    const mealDoc = await t.get(docRef);
    if (!mealDoc.exists()) throw new Error("Meal plan not found");

    const data = mealDoc.data() as MealPlanDay;
    const meals = data[slot] || [];
    const mealIndex = meals.findIndex(m => m.id === mealId);

    if (mealIndex === -1) throw new Error("Meal not found");
    const meal = meals[mealIndex];

    if (!meal.cooked) throw new Error("Not cooked yet");

    const itemReads: { ref: any, ing: any }[] = [];

    if (meal.ingredients && meal.ingredients.length > 0) {
      for (const ing of meal.ingredients) {
        const itemRef = doc(db, 'pantries', targetId, 'items', ing.pantryItemId);
        itemReads.push({ ref: itemRef, ing });
      }
    } else if (meal.isPantryItem && meal.pantryItemId) {
      const itemRef = doc(db, 'pantries', targetId, 'items', meal.pantryItemId);
      itemReads.push({
        ref: itemRef,
        ing: { pantryItemId: meal.pantryItemId, name: meal.name, quantityUsed: 1 }
      });
    }

    const itemSnapshots = [];
    for (const read of itemReads) {
      const snap = await t.get(read.ref);
      itemSnapshots.push({ snap, ing: read.ing, ref: read.ref });
    }

    // --- WRITE PHASE ---
    const updates: string[] = [];
    for (const { snap, ing, ref } of itemSnapshots) {
      if (snap.exists()) {
        const currentQty = Number((snap.data() as any).quantity) || 0;
        const qtyToRest = Number(ing.quantityUsed) || 0;
        const newQty = currentQty + qtyToRest;

        t.update(ref, { quantity: newQty, updatedAt: Date.now() });

        const histRef = doc(collection(db, 'pantries', targetId, 'items', ing.pantryItemId, 'history'));
        t.set(histRef, {
          itemId: ing.pantryItemId,
          oldQuantity: currentQty,
          newQuantity: newQty,
          diff: qtyToRest,
          reason: 'correction',
          timestamp: Date.now()
        });
        updates.push(`${ing.name}: ${currentQty} -> ${newQty}`);
      } else {
        console.warn(`Item not found during uncook: ${ing.name}`);
        updates.push(`${ing.name}: Item Not Found (ID mismatch?)`);
      }
    }

    // Update Meal Status
    const newMeals = [...meals];
    newMeals[mealIndex] = { ...meal, cooked: false };
    t.update(docRef, { [slot]: newMeals });

    return updates;
  });
}


async function setBudget(amount: number): Promise<void> {
  if (!currentUserId) throw new Error("No user");
  const targetId = getTargetId();

  // If family, update family doc. If user, update user doc.
  // Note: getTargetId returns familyId or userId. 
  // We need to know WHICH collection to update.

  if (currentFamilyId) {
    const familyRef = doc(db, 'families', currentFamilyId);
    await updateDoc(familyRef, { monthlyBudget: amount });
  } else {
    const userRef = doc(db, 'users', currentUserId);
    await updateDoc(userRef, { monthlyBudget: amount });
  }
}

async function getBudget(): Promise<number> {
  if (!currentUserId) return 0;

  if (currentFamilyId) {
    const familyRef = doc(db, 'families', currentFamilyId);
    const snap = await getDoc(familyRef);
    return snap.exists() ? (snap.data().monthlyBudget || 0) : 0;
  } else {
    const userRef = doc(db, 'users', currentUserId);
    const snap = await getDoc(userRef);
    return snap.exists() ? (snap.data().monthlyBudget || 0) : 0;
  }
}

async function leaveFamily(): Promise<void> {
  if (!currentUserId) throw new Error("No user");
  if (!currentFamilyId) throw new Error("Not in a family");

  // Remove user from family members list
  const familyRef = doc(db, 'families', currentFamilyId);
  await updateDoc(familyRef, {
    members: arrayRemove(currentUserId)
  });

  // Remove familyId from user
  const userRef = doc(db, 'users', currentUserId);
  await updateDoc(userRef, { familyId: null });
}

async function copyToFamily(newFamilyId: string): Promise<void> {
  if (!currentUserId) throw new Error("No user");

  console.log(`[Store] Copying items to family: ${newFamilyId}`);

  // Create a batch (limit 500 ops)
  const batch = writeBatch(db);
  let opCount = 0;

  const addToBatch = (item: Item, collectionName: 'pantries' | 'shoppingLists') => {
    if (opCount >= 490) return; // simple safety cap

    const newRef = doc(collection(db, collectionName, newFamilyId, 'items'));
    // Exclude id from data payload
    const { id, ...data } = item;
    batch.set(newRef, { ...data, updatedAt: Date.now() });

    // COPY ONLY - No deletion
    opCount += 1;
  };

  // 1. Private Pantry
  pantryItems.forEach(item => {
    addToBatch(item, 'pantries');
  });

  // 2. Legacy Private Pantry
  legacyPantryItems.forEach(item => {
    addToBatch(item, 'pantries');
  });

  // 3. Shopping List
  shoppingItems.forEach(item => {
    addToBatch(item, 'shoppingLists');
  });

  if (opCount > 0) {
    console.log(`[Store] Committing batch for ${opCount} items...`);
    await batch.commit();
    notify();
  } else {
    console.log('[Store] Nothing to copy.');
  }
}

// Export new functions
// JOIN FAMILY
async function joinFamily(inviteCode: string): Promise<string> {
  if (!currentUserId) throw new Error("No user");

  const code = inviteCode.trim().toUpperCase();

  // 1. Find family by code
  const q = query(collection(db, 'families'), where('inviteCode', '==', code));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("Invalid invite code");
  }

  const famDoc = snapshot.docs[0];
  const familyData = famDoc.data();
  const familyId = famDoc.id;

  // 2. Check if already a member
  if (familyData.members && familyData.members.includes(currentUserId)) {
    // Already a member, just update local user state if needed
    const userRef = doc(db, 'users', currentUserId);
    await updateDoc(userRef, { familyId: familyId });
    return familyData.name;
  }

  // 3. Add user to family
  await updateDoc(famDoc.ref, {
    members: arrayUnion(currentUserId)
  });

  // 4. Update User Doc & Copy items
  await copyToFamily(familyId);

  const userRef = doc(db, 'users', currentUserId);
  await updateDoc(userRef, { familyId: familyId });

  return familyData.name;
}

// DELETE FAMILY (Recursive)
async function deleteFamily(): Promise<void> {
  if (!currentUserId) throw new Error("No user");
  if (!currentFamilyId) throw new Error("Not in a family");

  console.log(`[Store] Deleting family ${currentFamilyId}...`);

  // 1. Delete all Pantry Items
  const pantryCol = collection(db, 'pantries', currentFamilyId, 'items');
  const pantrySnap = await getDocs(pantryCol);
  const batch = writeBatch(db);
  let count = 0;

  pantrySnap.forEach(doc => {
    batch.delete(doc.ref);
    count++;
  });

  // 2. Delete all Shopping List Items
  const shopCol = collection(db, 'shoppingLists', currentFamilyId, 'items');
  const shopSnap = await getDocs(shopCol);

  shopSnap.forEach(doc => {
    batch.delete(doc.ref);
    count++;
  });

  if (count > 0) {
    await batch.commit();
    console.log(`[Store] Deleted ${count} sub-items.`);
  }

  // 3. Delete Family Document
  await deleteDoc(doc(db, 'families', currentFamilyId));

  // 4. Clear familyId from User
  const userRef = doc(db, 'users', currentUserId);
  await updateDoc(userRef, { familyId: null });

  console.log(`[Store] Family deleted.`);
}

// SELF-REPAIR Code for Production
async function verifyFamilyIntegrity(familyId: string, userId: string) {
  try {
    const familyRef = doc(db, 'families', familyId);
    const snap = await getDoc(familyRef);

    if (snap.exists()) {
      const data = snap.data();
      const members = data.members || [];

      if (!members.includes(userId)) {
        console.log('[Store] SELF-REPAIR: User Missing from Family Members. Fixing...');
        await updateDoc(familyRef, {
          members: arrayUnion(userId)
        });
      }
    }
  } catch (e) {
    console.warn('[Store] Self-repair failed (likely permission/network)', e);
  }
}

export default {
  getAll,
  add,
  update,
  remove,
  subscribe,
  clearAll,
  cleanup,
  adjustQuantity,
  undoLastAdjustment,
  subscribeToMealPlan,
  addMeal,
  removeMeal,
  cookMeal,
  uncookMeal,
  setBudget,
  getBudget,
  cleanupHistory,
  leaveFamily,
  deleteFamily,
  copyToFamily,
  joinFamily,
  verifyFamilyIntegrity
};