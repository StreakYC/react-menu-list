/* @flow */

import React from 'react';
import type {Ref as ReactRef, Node as ReactNode, ComponentType as ReactComponentType} from 'react';
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
  opened: boolean;
};
export type Props = {
  className?: string;
  style?: Object;
  disabled?: boolean;
  title?: string;
  openedClassName?: string;
  openedStyle?: Object;

  positionOptions: FloatAnchorOptions;
  menuZIndex?: string|number;
  ButtonComponent: ReactComponentType<{domRef: ReactRef<any>}>;
  componentProps?: Object;
  parentElement?: HTMLElement;

  children?: ReactNode;
  menu: ReactNode;
  onWillOpen?: () => void;
  onDidOpen?: () => void;
  onWillClose?: () => void;
};

export default class MenuButton extends React.Component<Props, State> {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    disabled: PropTypes.bool,
    title: PropTypes.string,
    openedClassName: PropTypes.string,
    openedStyle: PropTypes.object,

    positionOptions: PropTypes.object,
    menuZIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ButtonComponent: PropTypes.func,
    componentProps: PropTypes.object,
    parentElement: PropTypes.any,

    children: PropTypes.node,
    menu: PropTypes.element,
    onWillOpen: PropTypes.func,
    onDidOpen: PropTypes.func,
    onWillClose: PropTypes.func
  };

  static defaultProps = {
    positionOptions: {position:'bottom', hAlign:'left'},
    ButtonComponent: ({domRef, ...props}: Object) => <button ref={domRef} {...props} />
  };

  state: State = {
    opened: false
  };

  _floatAnchorRef = React.createRef<FloatAnchor>();
  _anchorEl: ?HTMLElement = null;
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
      ])
        .filter(e => {
          const el = this._anchorEl;
          for (let node of FloatAnchor.parentNodes(e.target)) {
            if (node === el) return false;
          }
          return true;
        }),
      Kefir.fromEvents(window, 'keydown')
        .filter(e => e.key ? e.key === 'Escape' : e.which === 27)
        .map(e => {
          e.preventDefault();
          e.stopPropagation();
        })
    ])
      .takeUntilBy(this._onClose)
      .onValue(() => {
        this.close();
      });

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

  _itemChosen() {
    this.close();
  }

  componentWillUnmount() {
    this._onClose.emit();
  }

  render() {
    const {
      children, menu,
      positionOptions, menuZIndex,
      disabled, title, ButtonComponent
    } = this.props;
    const {opened} = this.state;

    let style = this.props.style;
    let className = this.props.className;
    if (opened) {
      if (this.props.openedStyle) {
        style = {...style, ...this.props.openedStyle};
      }
      if (this.props.openedClassName) {
        className = `${className||''} ${this.props.openedClassName}`;
      }
    }

    console.log('Rendering button ', this.props.parentElement)

    return (
      <FloatAnchor
        parentElement={this.props.parentElement}
        ref={this._floatAnchorRef}
        options={positionOptions}
        zIndex={menuZIndex}
        anchor={anchorRef =>
          <ButtonComponent
            domRef={el => {
              this._anchorEl = el;
              setRef(anchorRef, el);
            }}
            type="button"
            className={className}
            style={style}
            onMouseDown={e => {
              if (e.button !== 0) return;
              this.toggle();
            }}
            onKeyPress={e=>{
              if (e.key === 'Enter' || e.key === ' ') {
                this.toggle();
              }
            }}
            aria-haspopup={true}
            aria-expanded={opened}
            disabled={disabled}
            title={title}
            {...this.props.componentProps}
          >
            {children}
          </ButtonComponent>
        }
        float={
          !opened ? null :
            <MenuListInspector onItemChosen={() => this._itemChosen()}>
              {menu}
            </MenuListInspector>
        }
      />
    );
  }
}
