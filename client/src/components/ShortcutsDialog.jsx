import Modal from "./Modal";

const SHORTCUTS = [
  ["?", "Show keyboard shortcuts"],
  ["N", "New lecture"],
  ["1 – 5", "Switch tabs: Notes, Flashcards, Quiz, Chat, Transcript"],
  ["Space", "Flip the flashcard"],
  ["← →", "Previous / next flashcard"],
  ["Enter", "Send a chat message"],
  ["Shift + Enter", "New line in chat"],
  ["Esc", "Close dialogs"],
];

export default function ShortcutsDialog({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" width={480}>
      <dl className="shortcuts">
        {SHORTCUTS.map(([keys, label]) => (
          <div key={label}>
            <dt>
              <kbd>{keys}</kbd>
            </dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
      <div className="modal-actions">
        <button className="btn btn-primary" onClick={onClose} autoFocus>
          Got it
        </button>
      </div>
    </Modal>
  );
}
