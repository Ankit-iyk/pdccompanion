import { Cpu, Battery, BatteryLow, BatteryWarning, Wifi, WifiOff } from 'lucide-react';

function BatteryIcon({ level }) {
  if (level <= 20) return <BatteryLow className="w-4 h-4 text-red-400" />;
  if (level <= 40) return <BatteryWarning className="w-4 h-4 text-orange-400" />;
  return <Battery className="w-4 h-4 text-green-400" />;
}

const statusColors = {
  online:   'bg-green-400',
  offline:  'bg-red-400',
  charging: 'bg-amber-400',
};

export default function DeviceStatus({ devices = [] }) {
  return (
    <div className="space-y-2">
      {devices.map((device) => (
        <div
          key={device.id || device.device_type}
          className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/5"
        >
          <div className="flex items-center gap-3">
            <Cpu className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-200 capitalize">
                Smart {device.device_type}
              </p>
              <p className="text-xs text-slate-500">FW v{device.firmware_version}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <BatteryIcon level={device.battery_level} />
              <span className="text-xs text-slate-400">{device.battery_level}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusColors[device.status] || 'bg-slate-500'}`} />
              <span className="text-xs text-slate-400 capitalize">{device.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
