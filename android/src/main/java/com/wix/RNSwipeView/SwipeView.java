package com.wix.RNSwipeView;

import android.content.Context;
import android.support.v4.view.MotionEventCompat;
import android.support.v4.view.VelocityTrackerCompat;
import android.view.MotionEvent;
import android.view.VelocityTracker;
import android.view.ViewConfiguration;
import android.view.ViewGroup;

import com.facebook.react.uimanager.RootViewUtil;

public class SwipeView extends ViewGroup {

    public interface SwipeViewListener {
        void onSwipeStart();
        void onWillBeSwipedOut();
        void onSwipedOut();
        void onWillBounceBack();
        void onBouncedBack();
    }

    private static final float MIN_DISABLE_SCROLL = new ViewConfiguration().getScaledPagingTouchSlop();
    private static final boolean DEFAULT_ANIMATE_OPACITY = true;
    private static final boolean DEFAULT_ALLOW_DIRECTION = true;
    private float initialX = 0;
    private boolean swiping = false;
    private boolean animateOpacityLeft = DEFAULT_ANIMATE_OPACITY;
    private boolean animateOpacityRight = DEFAULT_ANIMATE_OPACITY;
    private boolean allowLeft = DEFAULT_ALLOW_DIRECTION;
    private boolean allowRight = DEFAULT_ALLOW_DIRECTION;
    private int swipeOutDistance = Integer.MAX_VALUE;
    private int swipeOutSpeed = Integer.MAX_VALUE;
    private SwipeViewListener listener;
    private VelocityTracker velocityTracker = null;

    public SwipeView(Context context) {
        super(context);
    }

    public void setListener(SwipeViewListener listener) {
        this.listener = listener;
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        swipeOutDistance = w/2;
        swipeOutSpeed = w/2;
    }

    @Override
    protected void onLayout(boolean changed, int l, int t, int r, int b) {

    }

    @Override
    public boolean onInterceptTouchEvent(MotionEvent event) {
        int action = MotionEventCompat.getActionMasked(event);
        switch(action) {
            case (MotionEvent.ACTION_DOWN):
                initialX = event.getRawX();
                if(velocityTracker == null) {
                    // Retrieve a new VelocityTracker object to watch the
                    // velocity of a motion.
                    velocityTracker = VelocityTracker.obtain();
                }
                else {
                    // Reset the velocity tracker back to its initial state.
                    velocityTracker.clear();
                }
                // Add a user's movement to the tracker.
                velocityTracker.addMovement(event);
                return false;
            case (MotionEvent.ACTION_MOVE) :
                velocityTracker.addMovement(event);
                velocityTracker.computeCurrentVelocity(1000);
                float deltaX = event.getRawX() - initialX;
                boolean nowSwiping = Math.abs(deltaX) > MIN_DISABLE_SCROLL &&
                    (allowLeft && deltaX < 0 ||
                     allowRight && deltaX > 0);
                if (!swiping && nowSwiping && listener != null) {
                    listener.onSwipeStart();
                }

                swiping = swiping || nowSwiping;
                if(swiping) {
                    RootViewUtil.getRootView(this).onChildStartedNativeGesture(event);
                }
                return swiping;
            case (MotionEvent.ACTION_UP) :
            case (MotionEvent.ACTION_CANCEL) :
            case (MotionEvent.ACTION_OUTSIDE) :
            default:
                return false;
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        int action = MotionEventCompat.getActionMasked(event);

        switch(action) {
            case (MotionEvent.ACTION_MOVE) :
                velocityTracker.addMovement(event);
                velocityTracker.computeCurrentVelocity(1000);
                float deltaX = event.getRawX() - initialX;
                handleMove(deltaX);
                return true;
            case (MotionEvent.ACTION_UP) :
            case (MotionEvent.ACTION_CANCEL) :
            case (MotionEvent.ACTION_OUTSIDE) :
                return handleUp(event);
            default :
                return super.onTouchEvent(event);
        }
    }

    private void handleMove(float deltaX) {
        if((!allowLeft && deltaX < 0) ||
           (!allowRight && deltaX > 0)) {
            deltaX = 0;
        }
        setTranslationX(deltaX);
        if (deltaX < 0 && animateOpacityLeft ||
            deltaX > 0 && animateOpacityRight) {
            float newAlpha = 1 - 0.9f * Math.min(1, Math.abs(deltaX) / swipeOutDistance);
            setAlpha(newAlpha);
        }
        requestDisallowInterceptTouchEvent(swiping);
    }

    private boolean handleUp(MotionEvent event) {
        int index = event.getActionIndex();
        int pointerId = event.getPointerId(index);

        float deltaX = event.getRawX() - initialX;
        float vx = VelocityTrackerCompat.getXVelocity(velocityTracker,
                                                      pointerId);
    if((Math.abs(deltaX) >= swipeOutDistance || Math.abs(vx) >= swipeOutSpeed) &&
           (allowLeft && deltaX < 0 || allowRight && deltaX > 0)) {
            animateOut(deltaX > 0);
        } else {
            animateBack(swiping);
        }
        swiping = false;
        return super.onTouchEvent(event);
    }

    private void animateBack(final boolean wasSwiping) {
        if (wasSwiping && listener != null) {
            listener.onWillBounceBack();
        }
        animate().alpha(1).setListener(null);
        animate().translationX(0).setListener(null).withEndAction(new Runnable() {
            @Override
            public void run() {
                if (wasSwiping && listener != null) {
                    listener.onBouncedBack();
                }
            }
        });
    }

    private void animateOut(boolean left) {
        if (listener != null) {
            listener.onWillBeSwipedOut();
        }
        animate().alpha(0);
        animate().translationX((left ? 1 : -1) * getContext().getResources().getDisplayMetrics().widthPixels)
                .setListener(null)
                .withEndAction(new Runnable() {
                    @Override
                    public void run() {
                        if (listener != null) {
                            listener.onSwipedOut();
                        }
                    }
                });
    }

    public void setAnimateOpacity(String direction) {
        this.animateOpacityLeft = this.animateOpacityRight = false;
        if("left".equals(direction)) {
            this.animateOpacityLeft = true;
        }
        if("right".equals(direction)) {
            this.animateOpacityRight = true;
        }
        if("both".equals(direction)) {
            this.animateOpacityLeft = this.animateOpacityRight = true;
        }
    }

    public void setDirection(String direction) {
        this.allowLeft = this.allowRight = false;
        if("left".equals(direction)) {
            this.allowLeft = true;
        }
        if("right".equals(direction)) {
            this.allowRight = true;
        }
        if("both".equals(direction)) {
            this.allowLeft = this.allowRight = true;
        }
    }
}
