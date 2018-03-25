import React, { Component } from 'react'
import {
  Animated,
  Easing,
  PanResponder,
  View
} from 'react-native'

class SwipeView extends View {
  static defaultProps = {
    swipeDirection: "both",
    changeOpacity: true,
    opacityDirection: "both",
    threshold: 50,
    useNativeDriver: true,
    onSwipe: (dir) => {},
    swipeOutDistance: null,
    swipeOutSpeed: null
  }

  constructor(props) {
    super(props)

    this._onLayout = this._onLayout.bind(this)

    let pan = new Animated.Value(0)
    let swipeOutDistance = new Animated.Value(Number.MAX_SAFE_INTEGER)
    this.state = {
      allowLeft: props.swipeDirection == 'left' || props.swipeDirection == 'both',
      allowRight: props.swipeDirection == 'right' || props.swipeDirection == 'both',
      animateOpacityLeft: props.changeOpacity && (props.opacityDirection == 'left' || props.opacityDirection == 'both'),
      animateOpacityRight: props.changeOpacity && (props.opacityDirection == 'right' || props.opacityDirection == 'both'),
      pan,
      swipeOutDistance,
      swipe: Animated.divide(pan, swipeOutDistance)
    }
  }

  componentWillMount() {
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, { dx, dy }) =>
        (Math.abs(dy) < 5 &&
         (this.state.allowLeft && dx < -5 ||
          this.state.allowRight && dx > 5)),
      onPanResponderMove: Animated.event([
        null,
        { dx: this.state.pan,
          useNativeDriver: this.props.useNativeDriver}
      ]),
      onPanResponderRelease: (e, {dx, vx}) => {
        let speed = Math.abs(vx)
        let dir = Math.sign(dx)
        if(dx > this.props.threshold || speed > 1) {
          Animated.timing(this.state.pan, {
            toValue: 2000 * dir,
            duration: Math.abs((2000 * dir - dx) / Math.max(speed, 1)),
            easing: Easing.linear,
            useNativeDriver: true
          }).start(() => {this.props.onSwipe(Math.sign(dx))})
        } else {
          this.reset()
        }
      },
      onPanResponderTerminate: () => {
        this.reset()
      }
    });
    this.state.pan.setValue(0)
  }

  _onLayout(event) {
    let {width} = event.nativeEvent.layout
    this.state.swipeOutDistance.setValue(width / 2)
  }

  reset() {
    Animated.timing(this.state.pan, {
      toValue: 0,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: this.props.useNativeDriver
    }).start()
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

export default SwipeView
