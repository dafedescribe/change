export class Notification {
  render(root: HTMLElement, message?: string): void {
    if (!message) {
      root.innerHTML = '';
      return;
    }

    const isError = message.toLowerCase().includes('below') || message.toLowerCase().includes('reject');
    const isSuccess = message.toLowerCase().includes('collected') || message.toLowerCase().includes('paid');

    const className = isError
      ? 'notification is-error'
      : isSuccess
      ? 'notification is-success'
      : 'notification is-info';

    root.innerHTML = `<p class="${className}" role="status">${message}</p>`;
  }
}
