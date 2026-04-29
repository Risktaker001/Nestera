import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ToastProvider } from "../context/ToastContext";
import { useToast } from "../context/ToastContext";

// Test component that uses the toast context
function ToastTrigger({ type, title, message }: { type: string; title: string; message?: string }) {
  const toast = useToast();

  const handleClick = () => {
    if (type === "success") toast.success(title, message);
    else if (type === "error") toast.error(title, message);
    else if (type === "warning") toast.warning(title, message);
    else if (type === "info") toast.info(title, message);
  };

  return <button onClick={handleClick}>Show Toast</button>;
}

function renderWithToast(type: string, title: string, message?: string) {
  return render(
    <ToastProvider>
      <ToastTrigger type={type} title={title} message={message} />
    </ToastProvider>
  );
}

describe("ToastContext", () => {
  it("renders children without crashing", () => {
    render(
      <ToastProvider>
        <div>Child content</div>
      </ToastProvider>
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("shows a success toast when success() is called", () => {
    renderWithToast("success", "Success!", "Operation completed");

    act(() => {
      screen.getByText("Show Toast").click();
    });

    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Operation completed")).toBeInTheDocument();
  });

  it("shows an error toast when error() is called", () => {
    renderWithToast("error", "Error occurred", "Something went wrong");

    act(() => {
      screen.getByText("Show Toast").click();
    });

    expect(screen.getByText("Error occurred")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("shows a warning toast when warning() is called", () => {
    renderWithToast("warning", "Warning", "Please review this");

    act(() => {
      screen.getByText("Show Toast").click();
    });

    expect(screen.getByText("Warning")).toBeInTheDocument();
  });

  it("shows an info toast when info() is called", () => {
    renderWithToast("info", "Info message", "FYI details here");

    act(() => {
      screen.getByText("Show Toast").click();
    });

    expect(screen.getByText("Info message")).toBeInTheDocument();
  });

  it("shows a toast without optional message", () => {
    renderWithToast("success", "Done!");

    act(() => {
      screen.getByText("Show Toast").click();
    });

    expect(screen.getByText("Done!")).toBeInTheDocument();
  });

  it("throws when useToast is used outside ToastProvider", () => {
    // Suppress expected error output
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    function BadComponent() {
      useToast();
      return <div />;
    }

    expect(() => render(<BadComponent />)).toThrow();
    consoleSpy.mockRestore();
  });
});
