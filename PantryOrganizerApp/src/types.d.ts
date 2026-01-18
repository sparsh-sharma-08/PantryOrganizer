declare module 'react-native-modal-datetime-picker' {
  import { ComponentType } from 'react';
  import { ModalProps } from 'react-native';
  type Props = {
    isVisible: boolean;
    mode?: 'date' | 'time' | 'datetime';
    onConfirm: (date: Date) => void;
    onCancel: () => void;
    minimumDate?: Date;
    maximumDate?: Date;
    headerTextIOS?: string;
  } & ModalProps;
  const DateTimePickerModal: ComponentType<Props>;
  export default DateTimePickerModal;
}