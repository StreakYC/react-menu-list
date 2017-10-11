## 4.0.0 (2017-10-04)

### Breaking Changes
* react-menu-list now requires React v16.

## 3.5.0 (2017-08-23)

* Use cross-env utility so that example can be built on Windows.
* Now compatible with Flow v0.53.

## 3.4.0 (2017-04-25)

* No longer uses now-deprecated `React.PropTypes`. Uses prop-types package now.

## 3.3.0 (2017-03-10)

* Added an optional callback parameter to MenuButton and SubMenuItem's open method.

## 3.2.3 (2017-03-06)

* Now compatible with Flow v0.41.
* Improved the documentation of MenuItem and MenuButton.

## 3.2.2 (2016-09-19)

* Fix bug where changes to index prop weren't respected.

## 3.2.1 (2016-08-05)

* Now compatible with Flow v0.30.

## 3.2.0 (2016-07-08)

* Added ButtonComponent prop to MenuButton.

## 3.1.0 (2016-06-14)

* Now auto-closes MenuButton's menu when an outside element gets focused.

## 3.0.0 (2016-06-07)

### Breaking Changes
* react-menu-list now requires React v15.

### Improvements
* Fix issue where MenuButton closed when its contents were focused.

## 2.1.0 (2016-05-04)

* Added hasHighlight method to several components.
* Added more MenuItem methods to SubMenuItem.
* Fixed issue where MenuList would still block the event of a user pressing Enter when no menu items were focused.
* Improved AutoComplete example with demonstrations of alternate behavior styles.

## 2.0.1 (2016-05-03)

* Fixed exceptions emitted when a MenuList had no items.

## 2.0.0 (2016-04-22)

### Breaking Changes
* The zIndex prop on MenuItem and SubMenuItem was renamed to menuZIndex.

## 1.4.1 (2016-04-15)

* MenuButton no longer opens when right-clicked.

## 1.4.0 (2016-04-14)

* Added reposition method to MenuButton and SubMenuItem.

## 1.3.1 (2016-04-12)

* Fixed focus outline appearing on MenuButton when opened with enter button in Chrome.
* Fixed MenuButton not closing in Safari and Firefox on OS X.

## 1.3.0 (2016-04-12)

* MenuButton now opens on mousedown.
* Added zIndex, openedStyle, and openedClassName props to MenuButton and SubMenuItem.
* Improved MenuButton documentation.

## 1.2.2 (2016-04-07)

* Now lists React v15 as an acceptable peer dependency.

## 1.2.1 (2016-04-01)

* Added disabled and title props to MenuButton.
* Change MenuButton to be type="button" rather than type="submit" so that browsers don't believe it submits forms.

## 1.2.0 (2016-04-01)

* Provide direction property in onHighlightChange event.
* Make MenuListInspector's moveCursor method return false instead of throwing an exception when no child menu list is found. Arguably this is an API-breaking change, but we're not bumping the major version number here because of the current unlikelihood that any users are depending on this now.

## 1.1.0 (2016-04-01)

* Add a small delay before a submenu opens when the user hovers over a SubMenuItem. This makes SubMenuItem's behavior more consistent with OS X dropdown menus, and seems to make the submenu's appearance seem less jarring to the user.

## 1.0.0 (2016-03-31)

* First stable release version.