/* @flow */

import React, {PropTypes} from 'react';
import {Dropdown, FloatAnchor, MenuList, MenuListItem} from '../src';
import type {Options as PositionOptions} from 'contain-by-screen';

type Props = {
  className?: ?string;
  style?: ?Object;
  positionOptions: PositionOptions;
  defaultValue: string;
  items: Array<string>;
};

type State = {
  opened: boolean;
  value: string;
};

export default class AutoComplete extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    positionOptions: PropTypes.object,

    defaultValue: PropTypes.string,
    items: PropTypes.array.isRequired
  };

  static defaultProps = {
    positionOptions: {position:'bottom', hAlign:'left'},
    defaultValue: ''
  };

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      opened: false,
      value: props.defaultValue
    };
  }

  open() {
    if (this.state.opened) return;
    this.setState({opened: true});
  }

  close() {
    if (!this.state.opened) return;
    this.setState({opened: false});
  }

  toggle() {
    if (this.state.opened) {
      this.close();
    } else {
      this.open();
    }
  }

  _itemChosen() {
    this.close();
  }

  render() {
    const {className, style, positionOptions, items} = this.props;
    const {value, opened} = this.state;
    return (
      <FloatAnchor
        options={positionOptions}
        anchor={
          <input
            type="text"
            className={className}
            style={style}
            value={value}
            onChange={e => this.setState({value: e.target.value})}
            onBlur={()=>this.close()}
            onFocus={()=>this.open()}
            onKeyDown={e=>{
              if (e.key === 'Escape' && opened) {
                this.close();
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          />
        }
        float={
          !opened ? null :
            <Dropdown>
              <MenuList
                onItemChosen={() => this.close()}
              >
                {items.map(item =>
                  <MenuListItem
                    highlightedStyle={{background: 'gray'}}
                    key={item}
                  >
                    {item}
                  </MenuListItem>
                )}
              </MenuList>
            </Dropdown>
        }
      />
    );
  }
}
