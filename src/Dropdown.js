/* @flow */

import React from "react";
import type { Node as ReactNode } from "react";
import PropTypes from "prop-types";

type Props = {
  children?: ReactNode,
  className?: string,
  style?: Object,
};

export default class Dropdown extends React.Component<Props> {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    style: PropTypes.object,
  };

  render() {
    var style = {
      background: "white",
      border: "1px solid rgba(0,0,0,.2)",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      padding: "6px 0",
      ...(this.props.style || {}),
    };

    return (
      <div className={this.props.className} style={style}>
        {this.props.children}
      </div>
    );
  }
}
