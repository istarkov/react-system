// @flow

import * as React from "react";
import { css } from "emotion";

type Theme = {|
  breakpoints: $ReadOnlyArray<number>,
  spaces: $ReadOnlyArray<number>
|};

type NumericProp = number | string | $ReadOnlyArray<number | string>;
type StringProp = string | $ReadOnlyArray<string>;

type BoxProps = {
  is?: string,
  css?: { [string]: mixed },
  children?: React.Node,

  width?: NumericProp,
  height?: NumericProp,

  p?: NumericProp,
  ph?: NumericProp,
  pv?: NumericProp,
  pt?: NumericProp,
  pr?: NumericProp,
  pb?: NumericProp,
  pl?: NumericProp,
  m?: NumericProp,
  mh?: NumericProp,
  mv?: NumericProp,
  mt?: NumericProp,
  mr?: NumericProp,
  mb?: NumericProp,
  ml?: NumericProp,

  flex?: NumericProp,
  justifySelf?: StringProp,
  alignSelf?: StringProp,
  order?: NumericProp
};

type FlexProps = {
  ...BoxProps,
  alignItems?: StringProp,
  alignContent?: StringProp,
  justifyItems?: StringProp,
  justifyContent?: StringProp,
  flexWrap?: StringProp,
  flexDirection?: StringProp
};

type Descriptor = {|
  prop: string,
  cssProp?: string,
  transform?: (number | string, Theme) => number | string
|};

const defaultTheme: Theme = {
  // mobile, desktop and large screens
  breakpoints: [768, 1280, 1920],
  // degrees of 2 except insignificant 2
  spaces: [0, 4, 8, 16, 32, 64, 128, 256]
};

export const SystemContext = /*#__PURE__*/ React.createContext<Theme>(
  defaultTheme
);

function resolveDispatcher() {
  const ReactCurrentOwner =
    // $FlowFixMe
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner;
  const dispatcher = ReactCurrentOwner.currentDispatcher;
  return dispatcher;
}

const readContext = <T>(Context: React.Context<T>): T => {
  const dispatcher = resolveDispatcher();
  return dispatcher.readContext(Context);
};

const createMediaQuery = value =>
  `@media screen and (min-width: ${
    typeof value === "number" ? `${Math.ceil(value / 16)}em` : value
  })`;

const ensureArray = value => {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};

const id2 = <T>(first: T, second: mixed): T => first;

const compileStyles = (props, context, styles) => {
  const mediaQueries = context.breakpoints.map(createMediaQuery);
  const result = {};
  // 1 more "zero" breakpoint
  for (let i = 0; i < styles.length; i += 1) {
    const { prop, cssProp = prop, transform = id2 } = styles[i];
    const values = ensureArray(props[prop]).map(value =>
      transform(value, context)
    );
    if (values.length !== 0) {
      result[cssProp] = values[0];
    }
  }
  // shift 1 to match values
  for (let i = 1; i < mediaQueries.length + 1; i += 1) {
    const mediaQuery = mediaQueries[i - 1];
    for (let j = 0; j < styles.length; j += 1) {
      const { prop, cssProp = prop, transform = id2 } = styles[j];
      const values = ensureArray(props[prop]).map(value =>
        transform(value, context)
      );
      if (i < values.length) {
        const value = values[i];
        if (result[mediaQuery] == null) {
          result[mediaQuery] = {};
        }
        result[mediaQuery][cssProp] = value;
      }
    }
  }
  return result;
};

const makePercent = value => (value === 0 ? 0 : `${value * 100}%`);

const getSizeValue = (value): string | number =>
  typeof value === "number"
    ? makePercent(Math.max(0, Math.min(value, 1)))
    : value;

const getSpace = (value, { spaces }) => {
  if (typeof value === "number") {
    const max = spaces.length - 1;
    const bound = Math.max(-max, Math.min(value, max));
    const sign = bound / Math.abs(bound);
    return sign * spaces[Math.abs(bound)];
  } else {
    return value;
  }
};

const sizeStyles: $ReadOnlyArray<Descriptor> = [
  { prop: "width", transform: getSizeValue },
  { prop: "height", transform: getSizeValue }
];

const spaceStyles: $ReadOnlyArray<Descriptor> = [
  { prop: "p", cssProp: "paddingTop", transform: getSpace },
  { prop: "p", cssProp: "paddingRight", transform: getSpace },
  { prop: "p", cssProp: "paddingBottom", transform: getSpace },
  { prop: "p", cssProp: "paddingLeft", transform: getSpace },

  { prop: "ph", cssProp: "paddingLeft", transform: getSpace },
  { prop: "ph", cssProp: "paddingRight", transform: getSpace },
  { prop: "pv", cssProp: "paddingTop", transform: getSpace },
  { prop: "pv", cssProp: "paddingBottom", transform: getSpace },

  { prop: "pt", cssProp: "paddingTop", transform: getSpace },
  { prop: "pr", cssProp: "paddingRight", transform: getSpace },
  { prop: "pb", cssProp: "paddingBottom", transform: getSpace },
  { prop: "pl", cssProp: "paddingLeft", transform: getSpace },

  { prop: "m", cssProp: "marginTop", transform: getSpace },
  { prop: "m", cssProp: "marginRight", transform: getSpace },
  { prop: "m", cssProp: "marginBottom", transform: getSpace },
  { prop: "m", cssProp: "marginLeft", transform: getSpace },

  { prop: "mh", cssProp: "marginLeft", transform: getSpace },
  { prop: "mh", cssProp: "marginRight", transform: getSpace },
  { prop: "mv", cssProp: "marginTop", transform: getSpace },
  { prop: "mv", cssProp: "marginBottom", transform: getSpace },

  { prop: "mt", cssProp: "marginTop", transform: getSpace },
  { prop: "mr", cssProp: "marginRight", transform: getSpace },
  { prop: "mb", cssProp: "marginBottom", transform: getSpace },
  { prop: "ml", cssProp: "marginLeft", transform: getSpace }
];

const flexItemStyles: $ReadOnlyArray<Descriptor> = [
  { prop: "flex" },
  { prop: "justifySelf" },
  { prop: "alignSelf" },
  { prop: "order" }
];

const flexBoxStyles: $ReadOnlyArray<Descriptor> = [
  { prop: "alignItems" },
  { prop: "alignContent" },
  { prop: "justifyItems" },
  { prop: "justifyContent" },
  { prop: "flexWrap" },
  { prop: "flexDirection" }
];

const omit = (obj, blacklist) => {
  const next = {};
  for (const key in obj) {
    if (blacklist.indexOf(key) === -1) {
      next[key] = obj[key];
    }
  }
  return next;
};

const getStylePropName = style => style.prop;

export const Box = ({
  is = "div",
  css: cssProp,
  children,
  ...props
}: BoxProps) => {
  const context = readContext(SystemContext);
  const initialStyle = css({
    boxSizing: "border-box",
    minWidth: 0,
    minHeight: 0
  });
  const styles = [...sizeStyles, ...spaceStyles, ...flexItemStyles];
  const generated = compileStyles(props, context, styles);
  const rest = omit(props, styles.map(getStylePropName));

  return React.createElement(
    is,
    {
      className: `${initialStyle} ${css(cssProp, generated)}`,
      ...rest
    },
    children == null ? null : children
  );
};

export const Flex = ({
  is = "div",
  css: cssProp,
  children,
  ...props
}: FlexProps) => {
  const context = readContext(SystemContext);
  const initialStyle = css({
    display: "flex",
    boxSizing: "border-box",
    minWidth: 0,
    minHeight: 0
  });
  const styles = [
    ...sizeStyles,
    ...spaceStyles,
    ...flexItemStyles,
    ...flexBoxStyles
  ];
  const generated = compileStyles(props, context, styles);
  const rest = omit(props, styles.map(getStylePropName));

  return React.createElement(
    is,
    {
      className: `${initialStyle} ${css(cssProp, generated)}`,
      ...rest
    },
    children == null ? null : children
  );
};
