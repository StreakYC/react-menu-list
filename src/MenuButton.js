/* @flow */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import FloatAnchor from 'react-float-anchor';
import type {Options as FloatAnchorOptions} from 'react-float-anchor';
import Kefir from 'kefir';
import kefirBus from 'kefir-bus';
import type {Bus} from 'kefir-bus';
import fromEventsCapture from './lib/fromEventsCapture';
import setRef from './lib/setRef';
import MenuListInspector from './MenuListInspector';

type State = {
  opened: boolean,
};

export type MenuButtonRenderProp = (
  domRef: React.Ref<any>,
  opened: boolean,
  onKeyDown: (e: KeyboardEvent) => void,
  onMouseDown: (e: MouseEvent) => void
) => React.Node;
export type Props = {
  positionOptions: FloatAnchorOptions,
  menuZIndex?: string | number,
  menuParentElement?: HTMLElement,

  renderButton?: MenuButtonRenderProp,

  children?: React.Node,
  className?: string,
  style?: Object,
  openedClassName?: string,
  openedStyle?: Object,
  disabled?: boolean,
  title?: string,

  menu: React.Node,
  onWillOpen?: () => void,
  onDidOpen?: () => void,
  onWillClose?: () => void,
  type?: string
};

export default class MenuButton extends React.Component<Props, State> {
  static propTypes = {
    positionOptions: PropTypes.object,
    menuZIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    renderButton: PropTypes.func,

    className: PropTypes.string,
    openedClassName: PropTypes.string,
    children: PropTypes.node,
    style: PropTypes.object,
    openedStyle: PropTypes.object,
    disabled: PropTypes.bool,
    title: PropTypes.string,

    menu: PropTypes.element,
    onWillOpen: PropTypes.func,
    onDidOpen: PropTypes.func,
    onWillClose: PropTypes.func,
    type: PropTypes.string,
  };

  static defaultProps = {
    positionOptions: {position: 'bottom', hAlign: 'left'},
    type: "button"
  };

  state: State = {
    opened: false,
  };

  _floatAnchorRef = React.createRef<FloatAnchor>();
  _anchorRef = React.createRef<HTMLElement>();
  _onClose: Bus<void> = kefirBus();

  open(): Promise<void> {
    if (this.state.opened) return Promise.resolve();
    if (this.props.onWillOpen) this.props.onWillOpen();

    // Clicking outside of the dropdown or pressing escape should close the
    // dropdown.
    Kefir.merge([
      Kefir.merge([
        fromEventsCapture(window, 'mousedown'),
        fromEventsCapture(window, 'focus')
          // Ignore window focus events that happen when the page regains focus
          .filter(e => e.target !== window),
      ]).filter(e => {
        const el = this._anchorRef;
        for (let node of FloatAnchor.parentNodes(e.target)) {
          if (node === el) return false;
        }
        return true;
      }),
      Kefir.fromEvents(window, 'keydown')
        .filter(e => (e.key ? e.key === 'Escape' : e.which === 27))
        .map(e => {
          e.preventDefault();
          e.stopPropagation();
        }),
    ])
      .takeUntilBy(this._onClose)
      .onValue(() => {
        ReactDOM.unstable_batchedUpdates(() => {
          this.close();
        });
      });

    // Possible alternative future design: instead of registering focus/blur/mouse/keydown
    // handlers globally, we could have a hidden input or menuitem inside of the
    // menu that's kept focused, and just receive blur and keydown events that bubble up
    // from it.
    // This would be more similar to React Select.
    // Similar design note is in MenuList.

    return new Promise(resolve => {
      this.setState({opened: true}, () => {
        if (this.props.onDidOpen) this.props.onDidOpen();
        resolve();
      });
    });
  }

  close() {
    if (!this.state.opened) return;
    if (this.props.onWillClose) this.props.onWillClose();
    this.setState({opened: false});
    this._onClose.emit();
  }

  toggle() {
    if (this.state.opened) {
      this.close();
    } else {
      this.open();
    }
  }

  reposition() {
    const floatAnchor = this._floatAnchorRef.current;
    if (!floatAnchor) throw new Error();
    floatAnchor.reposition();
  }

  _onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) {
      return;
    }

    this.toggle();
  };

  _onKeyDown = (e: KeyboardEvent) => {
    if (e.isComposing) {
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
      e.preventDefault();
      this.toggle();
    }
  };

  _setRef(el: HTMLElement | null, anchorRef: React.Ref<any>) {
    this._anchorRef = el;
    setRef(anchorRef, el);
  }

  _itemChosen() {
    this.close();
  }

  _defaultRenderButton = (
    domRef: React.Ref<any>,
    opened: boolean,
    onKeyDown: (e: KeyboardEvent) => void,
    onMouseDown: (e: MouseEvent) => void
  ) => {
    const {openedStyle, openedClassName} = this.props;
    let {style, className} = this.props;
    if (opened) {
      if (openedStyle) {
        style = {...style, ...openedStyle};
      }
      if (openedClassName) {
        className = `${className || ''} ${openedClassName}`;
      }
    }

    return (
      <button
        className={className}
        style={style}
        ref={domRef}
        aria-haspopup={true}
        aria-expanded={opened}
        onKeyDown={onKeyDown}
        onMouseDown={onMouseDown}
        disabled={this.props.disabled}
        title={this.props.title}
        type={this.props.type}
      >
        {this.props.children}
      </button>
    );
  };

  componentWillUnmount() {
    this._onClose.emit();
  }

  render() {
    const {menu, positionOptions, menuZIndex} = this.props;
    const {opened} = this.state;

    const renderButton = this.props.renderButton || this._defaultRenderButton;

    return (
      <FloatAnchor
        parentElement={this.props.menuParentElement}
        ref={this._floatAnchorRef}
        options={positionOptions}
        zIndex={menuZIndex}
        anchor={anchorRef =>
          renderButton(
            el => this._setRef(el, anchorRef),
            opened,
            this._onKeyDown,
            this._onMouseDown
          )
        }
        float={
          !opened ? null : (
            <MenuListInspector onItemChosen={() => this._itemChosen()}>
              {menu}
            </MenuListInspector>
          )
        }
      />
    );
  }
}
