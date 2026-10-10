"use client";

// A submit button that asks "are you sure?" first — for things that can't be
// undone, like deleting a draft. Cancelling the prompt stops the form.
export default function ConfirmSubmitButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
