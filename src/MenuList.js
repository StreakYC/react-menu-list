/* @flow */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import type {Node as ReactNode} from 'react';
import PropTypes from 'prop-types';
import Kefir from 'kefir';
import kefirStopper from 'kefir-stopper';
import findIndex from 'array-find-index';
import fromEventsCapture from './lib/fromEventsCapture';

import MenuEvent from './events/MenuEvent';
import ChosenEvent from './events/ChosenEvent';
import type {Props as MenuItemProps} from './MenuItem';
import {MenuListInspectorContext} from './MenuListInspector';
import type {MenuListInspectorContextValue} from './MenuListInspector';
import type {Direction, Rect} from './types';

// This type of object is given to a MenuItem to talk to the MenuList.
export type MenuListHandle = {
  highlight(byKeyboard: boolean): void,
  unhighlight(): void,
  moveCursor(direction: Direction, prevCursorLocation: ?Rect): void,
  itemChosen(): void,
  takeKeyboard(): void,
  releaseKeyboard(): void,
  lockHighlight(): void,
  unlockHighlight(): void,
  updateProps(props: MenuItemProps): void,
  unregister(): void,
};

// This type of object is given to a MenuList to talk to a MenuItem.
export type MenuItemControl = {
  notifyHighlighted(
    highlighted: boolean,
    byKeyboard: ?boolean,
    direction: ?Direction,
    prevCursorLocation: ?Rect
  ): void,
  notifyEvent(event: MenuEvent): void,
};

// This is the type of the object that MenuList gives as context to its
// descendants.
export type MenuListContextValue = {
  registerItem(
    props: MenuItemProps,
    control: MenuItemControl,
    el: HTMLElement
  ): MenuListHandle,
};

export const MenuListContext = React.createContext<?MenuListContextValue>(null);

export type Props = {
  onItemChosen?: (event: ChosenEvent) => void,
  onLeftPushed?: (event: MenuEvent) => void,
  onRightPushed?: (event: MenuEvent) => void,
  children?: ReactNode,
};

export default class MenuList extends React.Component<Props> {
  static propTypes = {
    onItemChosen: PropTypes.func,
    onLeftPushed: PropTypes.func,
    onRightPushed: PropTypes.func,
    children: PropTypes.node,
  };

  _stopper = kefirStopper();
  _listItems: Array<{
    props: MenuItemProps,
    control: MenuItemControl,
  }> = [];

  // The natural highlight is where the highlight would be if no lock is active.
  _naturalHighlightedIndex: ?number;
  _lockedHighlightedIndex: ?number;
  _keyboardTakenByIndex: ?number;

  #elRef = React.createRef<HTMLDivElement>();

  _getVisibleHighlightedIndex(): ?number {
    return this._lockedHighlightedIndex != null
      ? this._lockedHighlightedIndex
      : this._naturalHighlightedIndex;
  }

  static contextType = MenuListInspectorContext;

  _menuListContext: MenuListContextValue = {
    registerItem: (props, control, el) => {
      const item = {props, control, el};

      const register = () => {
        let i = -1;
        if (item.props.index == null) {
          i = findIndex(
            this._listItems,
            _item =>
              (item.el.compareDocumentPosition(_item.el) &
                Node.DOCUMENT_POSITION_PRECEDING) ===
              0
          );
        } else {
          i = findIndex(
            this._listItems,
            _item =>
              _item.props.index != null && item.props.index < _item.props.index
          );
        }
        if (i < 0) {
          this._listItems.push(item);
        } else {
          this._listItems.splice(i, 0, item);
          if (
            this._naturalHighlightedIndex != null &&
            i <= this._naturalHighlightedIndex
          ) {
            this._naturalHighlightedIndex++;
          }
          if (
            this._lockedHighlightedIndex != null &&
            i <= this._lockedHighlightedIndex
          ) {
            this._lockedHighlightedIndex++;
          }
          if (
            this._keyboardTakenByIndex != null &&
            i <= this._keyboardTakenByIndex
          ) {
            this._keyboardTakenByIndex++;
          }
        }
      };

      register();

      const menuListHandle: MenuListHandle = {
        highlight: (byKeyboard: boolean) => {
          const i = this._listItems.indexOf(item);
          if (i < 0) throw new Error('Already unregistered MenuItem');
          this._naturalHighlight(i, byKeyboard);
        },
        unhighlight: () => {
          const i = this._listItems.indexOf(item);
          if (i < 0) throw new Error('Already unregistered MenuItem');
          if (this._naturalHighlightedIndex === i) {
            this._naturalHighlight(null, false);
          }
        },
        itemChosen: () => {
          this._dispatchEvent(control, new ChosenEvent('chosen', false));
        },
        takeKeyboard: () => {
          const i = this._listItems.indexOf(item);
          if (i < 0) throw new Error('Already unregistered MenuItem');
          this._keyboardTakenByIndex = i;
        },
        releaseKeyboard: () => {
          const i = this._listItems.indexOf(item);
          if (i < 0) throw new Error('Already unregistered MenuItem');
          if (this._keyboardTakenByIndex === i) {
            this._keyboardTakenByIndex = null;
          }
        },
        lockHighlight: () => {
          const i = this._listItems.indexOf(item);
          if (i < 0) throw new Error('Already unregistered MenuItem');
          this._lockHighlight(i);
        },
        unlockHighlight: () => {
          const i = this._listItems.indexOf(item);
          if (i < 0) throw new Error('Already unregistered MenuItem');
          if (this._lockedHighlightedIndex === i) {
            this._lockHighlight(null);
          }
        },
        moveCursor: (direction: Direction, prevCursorLocation: ?Rect) => {
          this.moveCursor(direction, prevCursorLocation);
        },
        updateProps: (newProps: MenuItemProps) => {
          if (item.props.index !== newProps.index) {
            const oldIndex = this._listItems.indexOf(item);
            const isNaturalHighlightIndex =
              this._naturalHighlightedIndex === oldIndex;
            const isLockedHighlightIndex =
              this._lockedHighlightedIndex === oldIndex;
            const isKeyboardTakenByIndex =
              this._keyboardTakenByIndex === oldIndex;

            menuListHandle.unregister();
            props = newProps;
            item.props = newProps;
            register();

            if (
              isNaturalHighlightIndex ||
              isLockedHighlightIndex ||
              isKeyboardTakenByIndex
            ) {
              const newIndex = this._listItems.indexOf(item);
              if (isNaturalHighlightIndex)
                this._naturalHighlightedIndex = newIndex;
              if (isLockedHighlightIndex)
                this._lockedHighlightedIndex = newIndex;
              if (isKeyboardTakenByIndex) this._keyboardTakenByIndex = newIndex;
            }
          } else {
            props = newProps;
            item.props = newProps;
          }
        },
        unregister: () => {
          const i = this._listItems.indexOf(item);
          if (i < 0) throw new Error('Already unregistered MenuItem');
          if (i === this._naturalHighlightedIndex) {
            this._naturalHighlightedIndex = null;
          } else if (
            this._naturalHighlightedIndex != null &&
            i < this._naturalHighlightedIndex
          ) {
            this._naturalHighlightedIndex--;
          }
          if (i === this._lockedHighlightedIndex) {
            this._lockedHighlightedIndex = null;
          } else if (
            this._lockedHighlightedIndex != null &&
            i < this._lockedHighlightedIndex
          ) {
            this._lockedHighlightedIndex--;
          }
          if (i === this._keyboardTakenByIndex) {
            this._keyboardTakenByIndex = null;
          } else if (
            this._keyboardTakenByIndex != null &&
            i < this._keyboardTakenByIndex
          ) {
            this._keyboardTakenByIndex--;
          }
          this._listItems.splice(i, 1);
        },
      };
      return menuListHandle;
    },
  };

  _parentCtx(): ?MenuListInspectorContextValue {
    return this.context;
  }

  componentDidMount() {
    const isEnterOrArrowKey = e =>
      e.which === 13 || (37 <= e.which && e.which <= 40);
    const el = this.#elRef.current;
    /*:: if (!el) throw new Error(); */

    // The only things that should receive keydown/keypress events before us
    // are our children. This allows a MenuItem to contain a text input
    // which selectively stops propagation on key events for example.
    Kefir.merge([
      Kefir.fromEvents(window, 'keydown')
        .filter(isEnterOrArrowKey)
        .filter(e => el.contains(e.target)),
      fromEventsCapture(window, 'keydown')
        .filter(isEnterOrArrowKey)
        .filter(e => !el.contains(e.target)),
      Kefir.fromEvents(el, 'keydown').filter(isEnterOrArrowKey),
      fromEventsCapture(el, 'keydown').filter(isEnterOrArrowKey),
    ])
      .takeUntilBy(this._stopper)
      .onValue(event => {
        ReactDOM.unstable_batchedUpdates(() => {
          this._key(event);
        });
      });

    const parentCtx = this._parentCtx();
    if (parentCtx) {
      parentCtx.registerMenuList(this);
    }
  }

  componentWillUnmount() {
    this._stopper.destroy();

    const parentCtx = this._parentCtx();
    if (parentCtx) {
      parentCtx.unregisterMenuList(this);
    }
  }

  _naturalHighlight(
    index: ?number,
    byKeyboard: boolean,
    direction: ?Direction,
    prevCursorLocation: ?Rect
  ) {
    const visibleHighlightedIndex = this._getVisibleHighlightedIndex();

    if (this._lockedHighlightedIndex != null && byKeyboard) {
      this._lockedHighlightedIndex = null;
    }
    this._naturalHighlightedIndex = index;
    if (this._lockedHighlightedIndex == null) {
      if (index != null) {
        this._listItems[index].control.notifyHighlighted(
          true,
          byKeyboard,
          direction,
          prevCursorLocation
        );
      }
      if (visibleHighlightedIndex != null && visibleHighlightedIndex != index) {
        this._listItems[visibleHighlightedIndex].control.notifyHighlighted(
          false
        );
      }
    }
  }

  _lockHighlight(index: ?number) {
    if (index === this._lockedHighlightedIndex) return;
    const visibleHighlightedIndex = this._getVisibleHighlightedIndex();
    this._lockedHighlightedIndex = index;
    const newVisibleHighlightedIndex = this._getVisibleHighlightedIndex();
    if (visibleHighlightedIndex != null && newVisibleHighlightedIndex == null) {
      // When unlocking, prefer to keep the current selection over de-selecting
      // everything.
      this._naturalHighlightedIndex = visibleHighlightedIndex;
    } else if (visibleHighlightedIndex != newVisibleHighlightedIndex) {
      if (visibleHighlightedIndex != null) {
        this._listItems[visibleHighlightedIndex].control.notifyHighlighted(
          false
        );
      }
      if (newVisibleHighlightedIndex != null) {
        this._listItems[newVisibleHighlightedIndex].control.notifyHighlighted(
          true,
          false
        );
      } else if (this._naturalHighlightedIndex != null) {
        this._listItems[
          this._naturalHighlightedIndex
        ].control.notifyHighlighted(true, false);
      }
    }
  }

  _dispatchEvent(control: ?MenuItemControl, event: MenuEvent) {
    if (control) {
      control.notifyEvent(event);
      if (event.cancelBubble) return;
    }
    switch (event.type) {
      case 'chosen':
        /*:: if (!(event instanceof ChosenEvent)) throw new Error(); */
        if (this.props.onItemChosen) this.props.onItemChosen(event);
        break;
      // case 'up':
      //   break;
      // case 'down':
      //   break;
      case 'left':
        if (this.props.onLeftPushed) this.props.onLeftPushed(event);
        break;
      case 'right':
        if (this.props.onRightPushed) this.props.onRightPushed(event);
        break;
    }
    if (event.cancelBubble) return;
    const parentCtx = this._parentCtx();
    if (parentCtx) {
      parentCtx.dispatchEvent(event);
    }
  }

  _key(event: KeyboardEvent) {
    if (this._keyboardTakenByIndex != null || this._listItems.length === 0) {
      return;
    }

    const visibleHighlightedIndex = this._getVisibleHighlightedIndex();

    // enter, left, right activate for the current visibly selected item.
    // up and down de-activate any locks in place, so that they act from the last
    // naturally-selected item.

    let mEvent = null;

    switch (event.which) {
      case 13: //enter
        if (visibleHighlightedIndex != null) {
          mEvent = new ChosenEvent('chosen', true);
          event.preventDefault();
          event.stopPropagation();
        }
        break;
      case 37: //left
        if (visibleHighlightedIndex != null) {
          mEvent = new MenuEvent('left');
        }
        break;
      case 39: //right
        if (visibleHighlightedIndex != null) {
          mEvent = new MenuEvent('right');
        }
        break;
      case 38: //up
        event.preventDefault();
        event.stopPropagation();
        this.moveCursor('up');
        break;
      case 40: //down
        event.preventDefault();
        event.stopPropagation();
        this.moveCursor('down');
        break;
    }

    if (mEvent) {
      const control =
        visibleHighlightedIndex == null
          ? null
          : this._listItems[visibleHighlightedIndex].control;
      this._dispatchEvent(control, mEvent);
      if (mEvent.defaultPrevented) event.preventDefault();
      if (mEvent.defaultPrevented || mEvent.cancelBubble)
        event.stopPropagation();
    }
  }

  moveCursor(direction: Direction, prevCursorLocation: ?Rect) {
    if (this._listItems.length == 0) return;

    switch (direction) {
      case 'up':
        if (
          this._naturalHighlightedIndex == null ||
          this._naturalHighlightedIndex == 0
        ) {
          this._naturalHighlight(
            this._listItems.length - 1,
            true,
            direction,
            prevCursorLocation
          );
        } else {
          this._naturalHighlight(
            this._naturalHighlightedIndex - 1,
            true,
            direction,
            prevCursorLocation
          );
        }
        break;
      case 'down':
        if (
          this._naturalHighlightedIndex == null ||
          this._naturalHighlightedIndex == this._listItems.length - 1
        ) {
          this._naturalHighlight(0, true, direction, prevCursorLocation);
        } else {
          this._naturalHighlight(
            this._naturalHighlightedIndex + 1,
            true,
            direction,
            prevCursorLocation
          );
        }
        break;
    }
  }

  hasHighlight(): boolean {
    return this._getVisibleHighlightedIndex() != null;
  }

  render() {
    return (
      <div role="menu" ref={this.#elRef}>
        <MenuListContext.Provider value={this._menuListContext}>
          {this.props.children}
        </MenuListContext.Provider>
      </div>
    );
  }
}
