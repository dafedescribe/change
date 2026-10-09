import type { Passenger } from '../data/passengers';
import { renderPassenger } from './PassengerRenderer';
import { sceneLayout } from './SceneLayout';

export class BusScene {
  mount(
    root: HTMLElement,
    passengerList: Passenger[],
    selectedPassengerId: string | undefined,
    onSelect: (passenger: Passenger) => void
  ): void {
    root.innerHTML = sceneLayout();
    const passengerLayer = root.querySelector<HTMLElement>('[data-passengers]');
    if (!passengerLayer) return;
    passengerList.forEach((passenger) =>
      passengerLayer.append(
        renderPassenger(passenger, passenger.id === selectedPassengerId, onSelect)
      )
    );
  }
}
