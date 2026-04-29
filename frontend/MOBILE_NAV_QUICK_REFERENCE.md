# Mobile Navigation - Quick Reference

## 🚀 Quick Start

### Using the Hooks

```tsx
import { useFocusTrap } from '@/app/hooks/useFocusTrap';
import { useClickOutside } from '@/app/hooks/useClickOutside';
import { useBodyScrollLock } from '@/app/hooks/useBodyScrollLock';

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Focus trap
  useFocusTrap({
    isOpen,
    containerRef,
    onEscape: () => setIsOpen(false),
  });

  // Click outside
  useClickOutside({
    isActive: isOpen,
    ref: containerRef,
    onClickOutside: () => setIsOpen(false),
    excludeRefs: [buttonRef],
  });

  // Body scroll lock
  useBodyScrollLock({
    isLocked: isOpen,
  });

  return (
    <>
      <button ref={buttonRef} onClick={() => setIsOpen(!isOpen)}>
        Toggle
      </button>
      {isOpen && (
        <div ref={containerRef}>
          {/* Content */}
        </div>
      )}
    </>
  );
};
```

## 📦 Hook APIs

### useFocusTrap

```tsx
useFocusTrap({
  isOpen: boolean;                    // Required
  containerRef: RefObject;            // Required
  initialFocusRef?: RefObject;        // Optional
  onEscape?: () => void;              // Optional
});
```

**Features:**
- Tab/Shift+Tab cycling
- Escape key support
- Focus restoration
- Initial focus control

### useClickOutside

```tsx
useClickOutside({
  isActive: boolean;                  // Required
  ref: RefObject;                     // Required
  onClickOutside: () => void;         // Required
  excludeRefs?: RefObject[];          // Optional
});
```

**Features:**
- Mouse and touch events
- Multiple excluded refs
- Delayed attachment
- Automatic cleanup

### useBodyScrollLock

```tsx
useBodyScrollLock({
  isLocked: boolean;                  // Required
});
```

**Features:**
- Prevents body scroll
- No layout shift
- Scrollbar compensation
- Style restoration

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Escape** | Close menu |
| **Tab** | Next item |
| **Shift+Tab** | Previous item |
| **Enter** | Activate link |
| **Space** | Activate link |

## ♿ ARIA Attributes

### Menu Button
```tsx
<button
  aria-expanded={isOpen}
  aria-controls="menu-id"
  aria-label="Open menu"
>
```

### Menu Container
```tsx
<div
  id="menu-id"
  role="navigation"
  aria-label="Main menu"
  aria-hidden={!isOpen}
>
```

### Menu Items
```tsx
<Link
  aria-current={isActive ? "page" : undefined}
>
```

### Decorative Icons
```tsx
<svg aria-hidden="true">
```

## 🎯 Common Patterns

### Modal
```tsx
const Modal = ({ isOpen, onClose }) => {
  const ref = useRef(null);
  
  useFocusTrap({ isOpen, containerRef: ref, onEscape: onClose });
  useClickOutside({ isActive: isOpen, ref, onClickOutside: onClose });
  useBodyScrollLock({ isLocked: isOpen });
  
  return <div ref={ref}>{/* content */}</div>;
};
```

### Dropdown
```tsx
const Dropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  
  useClickOutside({
    isActive: isOpen,
    ref: menuRef,
    onClickOutside: () => setIsOpen(false),
    excludeRefs: [btnRef],
  });
  
  return (
    <>
      <button ref={btnRef} onClick={() => setIsOpen(!isOpen)}>Menu</button>
      {isOpen && <div ref={menuRef}>{/* items */}</div>}
    </>
  );
};
```

### Sidebar
```tsx
const Sidebar = ({ isOpen, onClose }) => {
  const ref = useRef(null);
  
  useFocusTrap({ isOpen, containerRef: ref, onEscape: onClose });
  useBodyScrollLock({ isLocked: isOpen });
  
  return <aside ref={ref}>{/* content */}</aside>;
};
```

## ✅ Checklist

### Implementation
- [ ] Add refs to container and button
- [ ] Integrate focus trap hook
- [ ] Add click outside hook
- [ ] Add body scroll lock hook
- [ ] Add ARIA attributes
- [ ] Test keyboard navigation
- [ ] Test screen reader

### ARIA Attributes
- [ ] `aria-expanded` on button
- [ ] `aria-controls` linking button to menu
- [ ] `aria-label` on button
- [ ] `role="navigation"` on menu
- [ ] `aria-hidden` on menu when closed
- [ ] `aria-current` on active items
- [ ] `aria-hidden` on decorative icons

### Keyboard Support
- [ ] Escape closes menu
- [ ] Tab navigates forward
- [ ] Shift+Tab navigates backward
- [ ] Enter activates items
- [ ] Focus visible
- [ ] Focus restored on close

### Screen Reader
- [ ] Menu state announced
- [ ] Current page announced
- [ ] All elements labeled
- [ ] Navigation clear
- [ ] No confusing announcements

## 🐛 Troubleshooting

### Focus trap not working
- Check container ref is attached
- Verify focusable elements exist
- Ensure `isOpen` is correct

### Click outside triggers immediately
- Use `excludeRefs` for button
- Check event propagation
- Verify delayed attachment

### Body scroll still works
- Check `isLocked` is true
- Look for conflicting CSS
- Verify hook is called

### Screen reader not announcing
- Check ARIA attributes present
- Verify `aria-hidden` correct
- Test with actual screen reader

## 📚 Full Documentation

See [MOBILE_NAVIGATION_GUIDE.md](./MOBILE_NAVIGATION_GUIDE.md) for complete guide.

---

**Quick Reference** | **Issue #724** | **Updated: 2026-04-28**
