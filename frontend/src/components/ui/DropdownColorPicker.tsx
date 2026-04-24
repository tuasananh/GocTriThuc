import ColorPicker from './ColorPicker';
import DropDown from './DropDown';

interface DropdownColorPickerProps {
  disabled?: boolean;
  buttonAriaLabel?: string;
  buttonClassName: string;
  color: string;
  icon: React.ReactNode;
  onChange?: (color: string, skipHistoryStack: boolean, skipRefocus: boolean) => void;
}

export default function DropdownColorPicker({
  disabled = false,
  color,
  icon,
  onChange,
  ...rest
}: DropdownColorPickerProps) {
  return (
    <DropDown
      {...rest}
      disabled={disabled}
      stopCloseOnClickSelf={true}
      hideChevron={true}
      buttonContent={
        <div className="relative flex items-center justify-center">
          {icon}
          <div
            className="absolute -bottom-0.5 left-0.5 right-0.5 h-1 rounded-sm"
            style={{ backgroundColor: color }}
          />
        </div>
      }
    >
      <ColorPicker color={color} onChange={onChange} />
    </DropDown>
  );
}
