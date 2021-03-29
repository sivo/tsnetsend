import { DeviceConfiguration, DeviceWithIndex } from "./types";

export function getMatchingDevices(parameters: Record<string, unknown>, devices: DeviceConfiguration[]): DeviceWithIndex[] {
  return devices.reduce<DeviceWithIndex[]>((result, device) => {
    device.parameters.forEach((deviceParameter, index) => {
      const matching = Object.entries(deviceParameter).every(([parameter, value], index) => {
        return (parameters as typeof deviceParameter)[parameter as keyof typeof deviceParameter] === value;
      });

      if(matching) {
        result.push({device, index});
      }
    });

    return result;
  }, []);
}