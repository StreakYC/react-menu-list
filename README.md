# react-menu-list

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/StreakYC/react-menu-list/blob/master/LICENSE.txt) [![npm version](https://badge.fury.io/js/react-menu-list.svg)](https://badge.fury.io/js/react-menu-list) [![CI Status](https://github.com/StreakYC/react-menu-list/workflows/CI/badge.svg)](https://github.com/StreakYC/react-menu-list/actions?query=workflow%3ACI)

This project is a set of components for building menus. This project works
well for dropdown and autocomplete menus. The menus are correctly
keyboard-accessible, and it includes polish like established desktop
application menus have such as well-behaved submenus which stay open even if
the user briefly moves the mouse over other menu items while moving toward the
submenu's dropdown.

This project differs from other similar projects because it allows arbitrary
elements to be in the menu, including allowing menu items to be nested into
other elements, and allows custom menu items that take control of the cursor.

This project doesn't include much CSS styling for the menus. You need to bring
your own CSS. This makes this project great for someone trying to match their
application's existing style. It's recommended that your application create
wrapper components around this project's components that add your application's
CSS.

![Example](https://streakyc.github.io/react-menu-list/video/menus.gif)

The above example can be tried here:

https://streakyc.github.io/react-menu-list/example/

You can find its code in the `example` directory. The example may be compiled
by running:

```
yarn
yarn example-build
# or use this to auto-rebuild on changes:
yarn example-watch
```

## Components

This project exports the following components:

### MenuList

This component defines a menu suitable for a dropdown. Whenever a MenuList is
rendered on the page, it will listen for keyboard button presses such as enter,
up, and down.

A MenuList supports the following props:

- `onItemChosen`: This is an optional function which is called when an item in
  the menu is chosen by the user. The callback is passed a `ChosenEvent` object.
  This event object does not identify which item was chosen by the user. Use the
  MenuItem's `onItemChosen` prop instead if you want to know which item was
  picked.
- `onLeftPushed`, `onRightPushed`: These are optional functions which are
  called when the user presses the left or right arrow key while the menu is
  open. The callback is passed a `MenuEvent` object.

A MenuList has the following public methods:

- `moveCursor(direction: Direction, prevCursorLocation: ?Rect)`: Move the
  cursor in the menu. `direction` must be the the string "up" or "down".
  `prevCursorLocation` may be an object with `top`, `bottom`, `left`, and
  `right` number properties, and it will be passed to the onHighlightChange
  callback of the newly selected MenuItem. (This property is only useful for
  when the cursor moves between two menu items which each implement their own
  cursor over their own subitems.)
- `hasHighlight()`: Returns true if any items in the list are currently
  highlighted.

### MenuItem

This component defines a selectable item in a MenuList. It should only be used
as a descendant of a MenuList. It does not need to be a direct child of the
MenuList component.

A MenuItem supports the following props:

- `onItemChosen`: This is an optional function which is called when the item is
  chosen by the user. The callback is passed a `ChosenEvent` object.
- `onHighlightChange`: This is an optional function which is called when the
  item is highlighted or unhighlighted by the user. A MenuItem is highlighted when the user hovers the mouse over it or uses the keyboard arrow keys to move the selection to it. The callback is passed a
  boolean representing whether the item is highlighted now, and if the item is
  highlighted, the second argument is an object with `byKeyboard` boolean
  property, `prevCursorLocation` optional property (see MenuList.moveCursor),
  and an optional `direction` string of "up" or "down" describing which key the
  user pressed to highlight the item.
- `onLeftPushed`, `onRightPushed`: These are optional functions which are
  called when the user presses the left or right arrow key while the menu item
  is highlighted. The callback is passed a `MenuEvent` object.
- `className`, `style`: These are optional and are passed as props to the
  MenuItem's underlying div.
- `highlightedClassName`, `highlightedStyle`: These are optional and are
  combined with the className and style props and passed to the underlying div
  when the item is highlighted.
- `index`: This is an optional number which overrides the menu item's index in the
  MenuList for keyboard control purposes. The order of menu items is normally
  determined by their position in the DOM when mounted. This property should be
  unnecessary unless you're reordering mounted menu items. If any MenuItems
  within a MenuList use this prop, then all of them should.
- `onMouseLeave`: This is an optional function which overrides the MenuItem's
  default onMouseLeave event handler, which is in charge of unhighlighting the
  menu item. Unless you're reimplementing SubMenuItem, you probably won't need
  this.
- `domRef`: Optional prop which is passed as the `ref` value to the MenuItem's
  div element.
- `noMouseHighlight`: Optional boolean prop to make it so the MenuItem doesn't enter the highlighted state when the mouse hovers over it. In this case, the MenuItem only becomes highlighted if selection is moved to it with the arrow keys, and the application is expected to add its own styling using the CSS `:hover` selector to style the MenuItem when it's hovered by the mouse separately from the highlight styling. This allows the behavior of [Material UI's Select component](https://mui.com/material-ui/react-select/) to be emulated where the keyboard-based selection highlight is unaffected by mouse hovering.

A MenuItem has the following public methods:

- `takeKeyboard()`: This causes the parent MenuList to stop listening for
  keyboard events until `releaseKeyboard()` is called or this menu item is
  removed. Used by SubMenuItem when a dropdown menu is opened.
- `releaseKeyboard()`: Cancels a previous `takeKeyboard()` call on this item.
- `lockHighlight()`: This prevents other items in the MenuList from becoming
  highlighted by the mouse until `unlockHighlight()` is called or this menu item
  is removed. Used by SubMenuItem to provide a grace period before it becomes
  unhighlighted and closes its dropdown.
- `unlockHighlight()`: Cancels a previous `lockHighlight()` call on this item.
- `highlight(byKeyboard: boolean=true)`: Attempt to highlight the menu item.
  If byKeyboard is false, then the attempt may not be successful if a highlight
  lock is in place.
- `unhighlight()`: Attempt to unhighlight the menu item.
- `moveCursor(direction: Direction, prevCursorLocation: ?Rect)`: See
  menuList.moveCursor.
- `hasHighlight()`: Returns true if the item is currently highlighted.

### SubMenuItem

This component is similar to MenuItem, except that it defines a menu item that
displays a dropdown when selected. The dropdown can have a nested MenuList.
SubMenuItem automatically keeps the item selected and the dropdown open for a
short grace period when the user moves the mouse off of the menu item if
they're moving the mouse toward the dropdown.

A SubMenuItem supports the following props:

- `menu`: This is the React element to show as the dropdown when the submenu is
  open.
- `positionOptions`: This is an optional object of options to control how the
  dropdown is aligned to the menu item. The options are the same as those
  supported by
  [contain-by-screen](https://github.com/Macil/contain-by-screen#readme).
  This defaults to `{position:'right', vAlign:'top', hAlign: 'left'}`.
- `menuZIndex`: This is an optional number controlling the z-index CSS property of
  the menu's container.
- `menuParentElement`: This is an optional HTMLElement to attach the menu's container
  to instead of the document's body element.
- `onWillOpen`: This is an optional function called before the submenu opens.
- `onDidOpen`: This is an optional function called after the submenu opened.
- `onWillClose`: This is an optional function called before the submenu closes.
- `className`, `style`, `highlightedClassName`, `highlightedStyle`, `index`,
  `onItemChosen`, `onHighlightChange`: These props are all passed through to the
  underlying MenuItem element.
- `openedClassName`, `openedStyle`: These are optional and are combined with
  the className and style props and passed to the underlying div when the item
  is opened.

A SubMenuItem has the following public methods:

- `open(): Promise<void>`
- `close()`
- `toggle()`
- `reposition()`: Repositions the floating submenu. Call this if you change the
  size of the menu.
- `highlight(byKeyboard: boolean=true)`: Attempt to highlight the menu item.
  If byKeyboard is false, then the attempt may not be successful if a highlight
  lock is in place. If byKeyboard is false, then the highlight will trigger the
  submenu to display.
- `unhighlight()`: Attempt to unhighlight the menu item.
- `moveCursor(direction: Direction, prevCursorLocation: ?Rect)`: See
  menuList.moveCursor.
- `hasHighlight()`: Returns true if the item is currently highlighted.

### MenuListInspector

This component lets you manipulate and listen to events from descendant
MenuList elements. See the Events section for more information. This component
is used by MenuButton to detect when a MenuList provided to it has been clicked
on, and by SubMenuItem to trigger highlighting its submenu.

A MenuListInspector supports the following props:

- `onItemChosen`, `onLeftPushed`, `onRightPushed`: These work the same as on
  MenuList.

A MenuListInspector has the following public methods:

- `moveCursor(direction: Direction, prevCursorLocation: ?Rect): boolean`: This
  calls moveCursor on the first descendant MenuList and returns true, or returns
  false if no descendant MenuLists were found.
- `hasHighlight()`: Returns true if any descendant lists currently have a
  highlighted item.

### MenuButton

This is a button which shows a dropdown when pressed. You can put a MenuList
into the dropdown, and the MenuButton will close the dropdown once a menu item
is chosen. You can avoid having the MenuButton close when an item is chosen by
calling the `stopPropagation` method on the ChosenEvent object passed to the
MenuItem's onItemChosen callback.

A MenuButton supports the following props:

- `menu`, `positionOptions`, `menuZIndex`, `menuParentElement`, `onWillOpen`, `onDidOpen`,
  `onWillClose`: These work the same as the props on SubMenuItem.
- If `renderButton` is not provided: `className`, `style`, `openedClassName`, `openedStyle`,`disabled`, `title` props are accepted and provided to the default html `<button>` element.
- `renderButton`: Optional render prop that allows a different component to be used
  instead of an html `<button>`. `renderButton` is a function with a signature of `(domRef: React.Ref<any>, opened: boolean, onKeyDown: (e: KeyboardEvent) => void, onMouseDown: (e: MouseEvent) => void) => React.Node`
  - `domRef` must be passed as a ref to the button's DOM element in your custom implementation
  - `opened` is whether the menu is being opened. Useful if you want the appearance of the button to change in this state
  - `onKeyDown` must be used to handle keydown events on your button
  - `onMouseDown` must be used to handle mousedown events on your custom button

A MenuButton has the following public methods:

- `open(): Promise<void>`
- `close()`
- `toggle()`
- `reposition()`: Repositions the floating submenu. Call this if you change the
  size of the menu.

### Dropdown

This is just a div with a bit of CSS on it to form the container for dropdown
contents. It's provided for convenience for use with SubMenuItem and
MenuButton. This component doesn't have any logic, so feel free to substitute
it with a component with styling more specific to your application.

This component supports no props besides `children`, which is passed through to
the underlying div.

## Events

Many callback props are called with a `MenuEvent` object. MenuEvents bubble
between components. A MenuEvent is first emitted on the originating MenuItem,
then the parent MenuList, and then on each MenuListInspector going upwards.

A MenuEvent object has a `type` string property, and `preventDefault` and
`stopPropagation` methods. Calling the `preventDefault` or `stopPropagation`
methods will cause the same method to be triggered on the source DOM event
object. Additionally, then `stopPropagation` method will stop the MenuEvent
from bubbling up to the parent menu components.

Some callback props are passed a `ChosenEvent` object, which extends the
`MenuEvent` class with a `byKeyboard` boolean property.

## Types

Both [TypeScript](https://www.typescriptlang.org/) and
[Flow](https://flowtype.org/) type definitions for this module are included!
The type definitions won't require any configuration to use.
