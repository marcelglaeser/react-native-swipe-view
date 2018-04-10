import React, { Component } from 'react'
import {
  Animated,
  Easing,
  PanResponder,
  View
} from 'react-native'
import PropTypes from 'prop-types'

const noop = () => {}
const directions = {
  '-1': 'left',
  '0': 'none',
  '1': 'right'
}

class SwipeView extends View {
  static defaultProps = {
    changeOpacity: true,
    opacityDirection: "both",
    swipeDirection: "both",

    removeViewOnSwipedOut: false,
    minPanToComplete: 0.5,
    bounceBackAnimDuration: 0.35,
    bounceBackAnimDamping: 0.65, // ignored on web, use bounceBackAnimDuration
    onSwipeStart: noop,
    onWillBeSwipedOut: noop,
    onSwipedOut: noop,
    onWillBounceBack: noop,
    onBouncedBack: noop
  }

  constructor(props) {
    super(props)

    this._onLayout = this._onLayout.bind(this)

    let pan = new Animated.Value(0)
    let swipeOutDistance = new Animated.Value(Number.MAX_SAFE_INTEGER)
    this.state = {
      allowLeft: props.swipeDirection == 'left' || props.swipeDirection == 'both',
      allowRight: props.swipeDirection == 'right' || props.swipeDirection == 'both',
      pan,
      swipeOutDistance,
      swipe: Animated.divide(pan, swipeOutDistance),
      size: {
        width: Number.MAX_SAFE_INTEGER
      }
    }
    this.state.animateOpacityLeft = this.state.allowLeft && props.changeOpacity && (props.opacityDirection == 'left' || props.opacityDirection == 'both')
    this.state.animateOpacityRight = this.state.allowRight && props.changeOpacity && (props.opacityDirection == 'right' || props.opacityDirection == 'both')
  }

  componentWillMount() {
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, { dx, dy }) => {
        let resp = (Math.abs(dy) < 5 &&
                    (this.state.allowLeft && dx < -5 ||
                     this.state.allowRight && dx > 5))
        if(resp) {
          this.props.onSwipeStart(directions[Math.sign(dx)])
        }
        return resp
      },
      onPanResponderMove: Animated.event([
        null,
        { dx: this.state.pan }
      ]),
      onPanResponderRelease: (e, {dx, vx}) => {
        let speed = Math.abs(vx)
        let dir = Math.sign(dx)
        let direction = directions[dir]
        if((Math.abs(dx) > this.props.minPanToComplete * this.state.size.width ||
            speed > 1) &&
           ((this.state.allowLeft && dir < 0) ||
            (this.state.allowRight && dir > 0))) {
          this.props.onWillBeSwipedOut(direction)
          Animated.timing(this.state.pan, {
            toValue: 2000 * dir,
            duration: Math.abs((2000 * dir - dx) / Math.max(speed, 1)),
            easing: Easing.linear
          }).start(() => {this.props.onSwipedOut(direction)})
        } else {
          this.reset(direction)
        }
      },
      onPanResponderTerminate: (e, {dx}) => {
        let direction = directions[Math.sign(dx)]
        this.reset(direction)
      }
    });
    this.state.pan.setValue(0)
  }

  _onLayout(event) {
    let {width} = event.nativeEvent.layout
    this.state.size.width = width
    this.state.swipeOutDistance.setValue(width / 2)
  }

  reset(dir) {
    if(dir !== 'none') {
      this.props.onWillBounceBack(dir)
    }
    Animated.timing(this.state.pan, {
      toValue: 0,
      duration: this.props.bounceBackAnimDuration * 1000,
      easing: Easing.ease
    }).start(() => {
      this.props.onBouncedBack(dir)
    })
  }

  render() {
    let translate
    if(this.state.allowLeft && this.state.allowRight) {
      translate = this.state.pan
    } else if(this.state.allowLeft) {
      translate = this.state.pan.interpolate({
        inputRange: [-1, 0],
        outputRange: [-1, 0],
        extrapolateRight: 'clamp'
      })
    } else {
      translate = this.state.pan.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolateLeft: 'clamp'
      })
    }

    let opacity
    if(this.state.animateOpacityLeft && this.state.animateOpacityRight) {
      opacity = this.state.swipe.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [.1, 1, .1],
        extrapolate: 'clamp'
      })
    } else if(this.state.animateOpacityLeft) {
      opacity = this.state.swipe.interpolate({
        inputRange: [-1, 0],
        outputRange: [.1, 1],
        extrapolate: 'clamp'
      })
    } else if(this.state.animateOpacityRight) {
      opacity = this.state.swipe.interpolate({
        inputRange: [0, 1],
        outputRange: [1, .1],
        extrapolate: 'clamp'
      })
    }
    return (
      <Animated.View
        onLayout={this._onLayout}
        style={[{transform:[{translateX: translate}]},
                opacity && {opacity}]}
        {...this.panResponder.panHandlers}>
        { this.props.children }
      </Animated.View>
    )
  }
}

SwipeView.propTypes = {
  changeOpacity: PropTypes.bool,
  removeViewOnSwipedOut: PropTypes.bool,
  minPanToComplete: PropTypes.number,
  bounceBackAnimDuration: PropTypes.number,
  bounceBackAnimDamping: PropTypes.number,
  onSwipeStart: PropTypes.func,
  onWillBeSwipedOut: PropTypes.func,
  onSwipedOut: PropTypes.func,
  onWillBounceBack: PropTypes.func,
  onBouncedBack: PropTypes.func
}


export default SwipeView
