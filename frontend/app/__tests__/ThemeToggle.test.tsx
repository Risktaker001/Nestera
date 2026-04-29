import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeProvider } from "../context/ThemeContext";

// Helper to render ThemeToggle within its required context
function renderThemeToggle(props = {}) {
  return render(
    <ThemeProvider>
      <ThemeToggle {...props} />
    </ThemeProvider>
  );
}

describe("ThemeToggle", () => {
  it("renders the toggle button", () => {
    renderThemeToggle();
    const button = screen.getByRole("button", { name: /theme:/i });
    expect(button).toBeInTheDocument();
  });

  it("opens the dropdown menu when clicked", () => {
    renderThemeToggle();
    const button = screen.getByRole("button", { name: /theme:/i });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes the dropdown menu when Escape is pressed", () => {
    renderThemeToggle();
    const button = screen.getByRole("button", { name: /theme:/i });

    fireEvent.click(button);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("shows Light, Dark, and System options in the dropdown", () => {
    renderThemeToggle();
    fireEvent.click(screen.getByRole("button", { name: /theme:/i }));

    // dropdown items have role="menuitemradio"
    expect(screen.getByRole("menuitemradio", { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /system/i })).toBeInTheDocument();
  });

  it("selects a theme option when clicked", () => {
    renderThemeToggle();
    fireEvent.click(screen.getByRole("button", { name: /theme:/i }));

    const darkButton = screen.getByRole("menuitemradio", { name: /dark/i });
    fireEvent.click(darkButton);

    // After selecting a theme, the dropdown should close
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("renders in compact mode without label text", () => {
    renderThemeToggle({ compact: true });
    // In compact mode, theme label text should not be visible
    expect(screen.queryByText("Light")).not.toBeInTheDocument();
    expect(screen.queryByText("Dark")).not.toBeInTheDocument();
    expect(screen.queryByText("System")).not.toBeInTheDocument();
  });

  it("has correct aria attributes on the toggle button", () => {
    renderThemeToggle();
    const button = screen.getByRole("button", { name: /theme:/i });

    expect(button).toHaveAttribute("aria-haspopup", "menu");
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });
});
