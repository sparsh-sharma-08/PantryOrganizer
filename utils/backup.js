const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

class DatabaseBackup {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.dbPath = path.join(__dirname, '../pantry.db');
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `backup-${timestamp}.db`);
      
      // Copy the database file
      fs.copyFileSync(this.dbPath, backupPath);
      
      // Compress the backup
      const compressedPath = backupPath + '.gz';
      const { gzip } = require('zlib');
      const { promisify } = require('util');
      const gzipAsync = promisify(gzip);
      
      const data = fs.readFileSync(backupPath);
      const compressed = await gzipAsync(data);
      fs.writeFileSync(compressedPath, compressed);
      
      // Remove uncompressed backup
      fs.unlinkSync(backupPath);
      
      logger.info(`Database backup created: ${compressedPath}`);
      
      // Clean old backups (keep last 7 days)
      this.cleanOldBackups();
      
      return compressedPath;
    } catch (error) {
      logger.error('Backup creation failed:', error);
      throw error;
    }
  }

  cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const now = new Date();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      files.forEach(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime;

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          logger.info(`Deleted old backup: ${file}`);
        }
      });
    } catch (error) {
      logger.error('Backup cleanup failed:', error);
    }
  }

  async restoreBackup(backupPath) {
    try {
      const { gunzip } = require('zlib');
      const { promisify } = require('util');
      const gunzipAsync = promisify(gunzip);

      const compressed = fs.readFileSync(backupPath);
      const data = await gunzipAsync(compressed);
      
      const tempPath = backupPath.replace('.gz', '-temp.db');
      fs.writeFileSync(tempPath, data);

      // Create backup of current database before restore
      const currentBackup = path.join(this.backupDir, `pre-restore-${Date.now()}.db`);
      fs.copyFileSync(this.dbPath, currentBackup);

      // Restore the backup
      fs.copyFileSync(tempPath, this.dbPath);
      fs.unlinkSync(tempPath);

      logger.info(`Database restored from: ${backupPath}`);
      return true;
    } catch (error) {
      logger.error('Backup restoration failed:', error);
      throw error;
    }
  }

  getBackupList() {
    try {
      const files = fs.readdirSync(this.backupDir);
      return files
        .filter(file => file.endsWith('.gz'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.mtime
          };
        })
        .sort((a, b) => b.created - a.created);
    } catch (error) {
      logger.error('Failed to get backup list:', error);
      return [];
    }
  }

  async exportUserData(userId) {
    const db = require('../database');
    
    try {
      const data = await new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            'pantry_items' as type,
            name,
            quantity,
            expiry_date,
            category,
            created_at,
            updated_at
          FROM pantry_items 
          WHERE user_id = ?
          UNION ALL
          SELECT 
            'shopping_list' as type,
            name,
            quantity,
            expiry_date,
            category,
            created_at,
            updated_at
          FROM shopping_list 
          WHERE user_id = ?
        `, [userId, userId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      return {
        exportDate: new Date().toISOString(),
        userId: userId,
        data: data
      };
    } catch (error) {
      logger.error('User data export failed:', error);
      throw error;
    }
  }
}

// Schedule automatic backups
const scheduleBackup = () => {
  const backup = new DatabaseBackup();
  
  // Create backup every 24 hours
  setInterval(async () => {
    try {
      await backup.createBackup();
    } catch (error) {
      logger.error('Scheduled backup failed:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
};

module.exports = { DatabaseBackup, scheduleBackup }; 