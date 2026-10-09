import type { Passenger } from '../data/passengers';
import { formatNaira } from '../utils/currency';
import { assets } from '../data/assets';

export function renderPassenger(
  passenger: Passenger,
  isSelected: boolean,
  onSelect: (passenger: Passenger) => void
): HTMLButtonElement {
  const button = document.createElement('button');
  const isDroppedOff = passenger.status === 'dropped-off';
  const hasDebt = (passenger.outstandingBalance ?? 0) > 0 && passenger.paymentStatus === 'partial';
  const isPaid = passenger.paymentStatus === 'paid';
  const isChangeHeld = Boolean(passenger.changeHeld && (passenger.heldChangeAmount ?? 0) > 0);
  const isMarried = Boolean(passenger.marriedTo);

  button.className = [
    'passenger',
    `passenger-${passenger.id}`,
    isSelected ? 'is-selected' : '',
    isDroppedOff ? 'is-dropped-off' : '',
    isChangeHeld ? 'is-held' : '',
  ]
    .filter(Boolean)
    .join(' ');

  button.type = 'button';
  button.dataset.passengerId = passenger.id;
  button.disabled = isDroppedOff;

  let statusBadgeText = 'Waiting';
  let statusBadgeClass = 'status-waiting';

  if (isDroppedOff) {
    if (isChangeHeld) {
      statusBadgeText = `Left Angry (₦${passenger.heldChangeAmount})`;
      statusBadgeClass = 'status-partial';
    } else if ((passenger.outstandingBalance ?? 0) > 0) {
      statusBadgeText = `Owes ₦${passenger.outstandingBalance}`;
      statusBadgeClass = 'status-partial';
    } else {
      statusBadgeText = 'Alighted';
      statusBadgeClass = 'status-dropped';
    }
  } else if (isMarried) {
    statusBadgeText = 'Married (Change Shared)';
    statusBadgeClass = 'status-paid';
  } else if (isChangeHeld) {
    statusBadgeText = `Change Held: ₦${passenger.heldChangeAmount}`;
    statusBadgeClass = 'status-held';
  } else if (isPaid) {
    statusBadgeText = 'Paid';
    statusBadgeClass = 'status-paid';
  } else if (hasDebt) {
    statusBadgeText = `Owes ${formatNaira(passenger.outstandingBalance)}`;
    statusBadgeClass = 'status-partial';
  }

  button.setAttribute(
    'aria-label',
    `${passenger.name}, destination ${passenger.destination}, fare ${formatNaira(passenger.fare)}, status: ${statusBadgeText}`
  );

  const accentColor = passenger.appearance?.accent ?? passenger.accent;

  button.innerHTML = `
    <img class="passenger-art" src="${passenger.appearance?.sprite ?? assets.passengerDefault}" alt="" aria-hidden="true" />
    <span class="passenger-head" style="--accent: ${accentColor}">
      <span class="character-prop prop-${passenger.id}"></span>
    </span>
    <span class="passenger-body" style="--accent: ${accentColor}"></span>
    <span class="passenger-card">
      <div class="passenger-header">
        <strong>${passenger.name}</strong>
        <span class="passenger-badge ${statusBadgeClass}">${statusBadgeText}</span>
      </div>
      <small>${passenger.origin ? `${passenger.origin} → ` : ''}${passenger.destination} · ${formatNaira(passenger.fare)}</small>
    </span>
  `;

  if (!isDroppedOff) {
    button.addEventListener('click', () => onSelect(passenger));
  }

  return button;
}
