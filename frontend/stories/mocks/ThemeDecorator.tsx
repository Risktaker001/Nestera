import React from "react";
import { ThemeContext } from "../../app/context/ThemeContext";

export const ThemeDecorator = (Story: any) => {
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("dark");
  
  const value = {
    theme,
    resolvedTheme: theme === "system" ? "dark" : theme as "light" | "dark",
    setTheme: (t: any) => setTheme(t),
    toggleTheme: () => setTheme(prev => prev === "dark" ? "light" : "dark"),
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={value.resolvedTheme} data-theme={value.resolvedTheme}>
        <div className="bg-background text-foreground min-h-screen p-8">
          <Story />
        </div>
      </div>
    </ThemeContext.Provider>
  );
};
