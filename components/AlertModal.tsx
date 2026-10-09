"use client";

// Blocking pop-up for important alerts (e.g. unpaid balance).
export default function AlertModal({ title = "Payment pending", message, onClose }: { title?: string; message: string; onClose: () => void }) {
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal alert-modal" role="alertdialog" aria-modal="true">
        <div className="alert-icon">!</div>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="actions" style={{ justifyContent: "center" }}>
          <button className="btn" autoFocus onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
