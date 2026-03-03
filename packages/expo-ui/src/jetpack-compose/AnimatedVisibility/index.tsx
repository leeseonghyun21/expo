import { requireNativeView } from 'expo';

import { PrimitiveBaseProps, transformProps } from '../layout-types';

// --- Symbols for internal value extraction ---

const ENTER_TRANSITION_SYMBOL = Symbol('enterTransition');
const EXIT_TRANSITION_SYMBOL = Symbol('exitTransition');

// --- Serialized record types (sent to native) ---

type EnterTransitionRecord = {
  type:
    | 'fadeIn'
    | 'slideInHorizontally'
    | 'slideInVertically'
    | 'expandIn'
    | 'expandHorizontally'
    | 'expandVertically'
    | 'scaleIn';
  initialAlpha?: number;
  /** Fraction of width: -1.0 = full width left, 1.0 = full width right */
  initialOffsetX?: number;
  /** Fraction of height: -1.0 = full height top, 1.0 = full height bottom */
  initialOffsetY?: number;
  initialScale?: number;
};

type ExitTransitionRecord = {
  type:
    | 'fadeOut'
    | 'slideOutHorizontally'
    | 'slideOutVertically'
    | 'shrinkOut'
    | 'shrinkHorizontally'
    | 'shrinkVertically'
    | 'scaleOut';
  targetAlpha?: number;
  /** Fraction of width: -1.0 = full width left, 1.0 = full width right */
  targetOffsetX?: number;
  /** Fraction of height: -1.0 = full height top, 1.0 = full height bottom */
  targetOffsetY?: number;
  targetScale?: number;
};

// --- Chainable types (public API) ---

/**
 * Represents an enter transition that can be combined with other enter transitions using `.plus()`.
 */
export type EnterTransitionType = {
  /** Combines this transition with another enter transition (mirrors Compose's `+` operator). */
  plus: (other: EnterTransitionType) => EnterTransitionType;
  [ENTER_TRANSITION_SYMBOL]: () => EnterTransitionRecord[];
};

/**
 * Represents an exit transition that can be combined with other exit transitions using `.plus()`.
 */
export type ExitTransitionType = {
  /** Combines this transition with another exit transition (mirrors Compose's `+` operator). */
  plus: (other: ExitTransitionType) => ExitTransitionType;
  [EXIT_TRANSITION_SYMBOL]: () => ExitTransitionRecord[];
};

// --- Internal builders ---

function createEnterTransition(records: EnterTransitionRecord[]): EnterTransitionType {
  return {
    plus: (other) => createEnterTransition([...records, ...other[ENTER_TRANSITION_SYMBOL]()]),
    [ENTER_TRANSITION_SYMBOL]: () => records,
  };
}

function createExitTransition(records: ExitTransitionRecord[]): ExitTransitionType {
  return {
    plus: (other) => createExitTransition([...records, ...other[EXIT_TRANSITION_SYMBOL]()]),
    [EXIT_TRANSITION_SYMBOL]: () => records,
  };
}

// --- Factory namespaces (public API) ---

/**
 * Factory for enter transitions used with `AnimatedVisibility`.
 * Transitions can be combined using `.plus()`.
 *
 * @example
 * ```tsx
 * // Single transition
 * EnterTransition.fadeIn()
 *
 * // Combined transitions
 * EnterTransition.fadeIn({ initialAlpha: 0.3 })
 *   .plus(EnterTransition.slideInHorizontally({ initialOffsetX: 1.0 }))
 * ```
 */
export const EnterTransition = {
  /** Fades the content in. */
  fadeIn: (params?: { initialAlpha?: number }) =>
    createEnterTransition([{ type: 'fadeIn', ...params }]),
  /** Slides the content in horizontally. */
  slideInHorizontally: (params?: { initialOffsetX?: number }) =>
    createEnterTransition([{ type: 'slideInHorizontally', ...params }]),
  /** Slides the content in vertically. */
  slideInVertically: (params?: { initialOffsetY?: number }) =>
    createEnterTransition([{ type: 'slideInVertically', ...params }]),
  /** Expands the content from the center. */
  expandIn: () => createEnterTransition([{ type: 'expandIn' }]),
  /** Expands the content horizontally from the center. */
  expandHorizontally: () => createEnterTransition([{ type: 'expandHorizontally' }]),
  /** Expands the content vertically from the center. */
  expandVertically: () => createEnterTransition([{ type: 'expandVertically' }]),
  /** Scales the content in from a smaller size. */
  scaleIn: (params?: { initialScale?: number }) =>
    createEnterTransition([{ type: 'scaleIn', ...params }]),
};

/**
 * Factory for exit transitions used with `AnimatedVisibility`.
 * Transitions can be combined using `.plus()`.
 *
 * @example
 * ```tsx
 * // Single transition
 * ExitTransition.fadeOut()
 *
 * // Combined transitions
 * ExitTransition.fadeOut()
 *   .plus(ExitTransition.slideOutHorizontally({ targetOffsetX: 1.0 }))
 * ```
 */
export const ExitTransition = {
  /** Fades the content out. */
  fadeOut: (params?: { targetAlpha?: number }) =>
    createExitTransition([{ type: 'fadeOut', ...params }]),
  /** Slides the content out horizontally. */
  slideOutHorizontally: (params?: { targetOffsetX?: number }) =>
    createExitTransition([{ type: 'slideOutHorizontally', ...params }]),
  /** Slides the content out vertically. */
  slideOutVertically: (params?: { targetOffsetY?: number }) =>
    createExitTransition([{ type: 'slideOutVertically', ...params }]),
  /** Shrinks the content towards the center. */
  shrinkOut: () => createExitTransition([{ type: 'shrinkOut' }]),
  /** Shrinks the content horizontally towards the center. */
  shrinkHorizontally: () => createExitTransition([{ type: 'shrinkHorizontally' }]),
  /** Shrinks the content vertically towards the center. */
  shrinkVertically: () => createExitTransition([{ type: 'shrinkVertically' }]),
  /** Scales the content out to a smaller size. */
  scaleOut: (params?: { targetScale?: number }) =>
    createExitTransition([{ type: 'scaleOut', ...params }]),
};

// --- Props & component ---

export type AnimatedVisibilityProps = {
  children?: React.ReactNode;
  /**
   * Whether the content is visible. When changed, the content will animate in or out.
   */
  visible: boolean;
  /**
   * The enter transition to use when `visible` changes to `true`.
   * Use `EnterTransition` factory methods and combine with `.plus()`.
   * Defaults to Compose's `fadeIn + expandIn` when not specified.
   */
  enterTransition?: EnterTransitionType;
  /**
   * The exit transition to use when `visible` changes to `false`.
   * Use `ExitTransition` factory methods and combine with `.plus()`.
   * Defaults to Compose's `fadeOut + shrinkOut` when not specified.
   */
  exitTransition?: ExitTransitionType;
} & PrimitiveBaseProps;

type AnimatedVisibilityNativeProps = Omit<
  AnimatedVisibilityProps,
  'enterTransition' | 'exitTransition'
> & {
  enterTransition?: EnterTransitionRecord[];
  exitTransition?: ExitTransitionRecord[];
};

const AnimatedVisibilityNativeView: React.ComponentType<AnimatedVisibilityNativeProps> =
  requireNativeView('ExpoUI', 'AnimatedVisibilityView');

export function AnimatedVisibility(props: AnimatedVisibilityProps) {
  const { enterTransition, exitTransition, ...rest } = props;
  return (
    <AnimatedVisibilityNativeView
      {...transformProps(rest)}
      enterTransition={enterTransition?.[ENTER_TRANSITION_SYMBOL]()}
      exitTransition={exitTransition?.[EXIT_TRANSITION_SYMBOL]()}
    />
  );
}
