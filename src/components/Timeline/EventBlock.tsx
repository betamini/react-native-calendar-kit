import isEqual from 'lodash/isEqual';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { DEFAULT_PROPS } from '../../constants';
import type { PackedEvent, ThemeProperties } from '../../types';
import { shallowEqual } from '../../utils';

export interface EventBlockProps {
  event: PackedEvent;
  dayIndex: number;
  columnWidth: number;
  onPressEvent?: (eventItem: PackedEvent) => void;
  onLongPressEvent?: (eventItem: PackedEvent) => void;
  timeIntervalHeight: SharedValue<number>;
  renderEventContent?: (
    event: PackedEvent,
    timeIntervalHeight: SharedValue<number>
  ) => JSX.Element;
  selectedEventId?: string;
  theme: ThemeProperties;
  eventAnimatedDuration?: number;
  isPinchActive: SharedValue<boolean>;
  heightByTimeInterval: SharedValue<number>;
}

const EVENT_DEFAULT_COLOR = '#FFFFFF';

const EventBlock = ({
  event,
  dayIndex,
  columnWidth,
  onPressEvent,
  onLongPressEvent,
  renderEventContent,
  theme,
  selectedEventId,
  eventAnimatedDuration,
  isPinchActive,
  timeIntervalHeight,
  heightByTimeInterval,
}: EventBlockProps) => {
  const _onLongPress = () => {
    const eventParams = {
      ...event,
      top: event.startHour * heightByTimeInterval.value,
      height: event.duration * heightByTimeInterval.value,
      leftByIndex: columnWidth * dayIndex,
    };
    onLongPressEvent?.(eventParams);
  };

  const _onPress = () => {
    const eventParams = {
      ...event,
      top: event.startHour * heightByTimeInterval.value,
      height: event.duration * heightByTimeInterval.value,
      leftByIndex: columnWidth * dayIndex,
    };
    onPressEvent?.(eventParams);
  };

  const eventStyle = useAnimatedStyle(() => {
    const eventHoursPreviusDays = Math.max(event.startHour * -1, 0);
    const eventHoursNextDays = Math.max(
      event.startHour + event.duration - 24,
      0
    );
    const eventDurationValue =
      event.duration - eventHoursPreviusDays - eventHoursNextDays;
    const eventStartHour = event.startHour + eventHoursPreviusDays;

    let eventStartHourValue = eventStartHour * heightByTimeInterval.value;

    let eventHeight = eventDurationValue * heightByTimeInterval.value;

    // Hotfix for bug in android: It opens the drawer with react-navigation when swiping left or right on an event if that event is right at the bottom or top of the screen.
    eventStartHourValue += 1;
    eventHeight -= 2;

    if (theme.minimumEventHeight) {
      eventHeight = Math.max(theme.minimumEventHeight, eventHeight);
    }

    if (isPinchActive.value) {
      return {
        top: eventStartHourValue,
        height: eventHeight,
        left: event.left + columnWidth * dayIndex,
        width: event.width,
      };
    }

    const hasPreviusDay = eventHoursPreviusDays > 0;
    const hasNextDay = eventHoursNextDays > 0;

    return {
      top: withTiming(eventStartHourValue, {
        duration: eventAnimatedDuration,
      }),
      height: withTiming(eventHeight, {
        duration: eventAnimatedDuration,
      }),
      left: withTiming(event.left + columnWidth * dayIndex, {
        duration: eventAnimatedDuration,
      }),
      width: withTiming(event.width, {
        duration: eventAnimatedDuration,
      }),
      borderTopLeftRadius: hasPreviusDay ? 0 : 4,
      borderTopRightRadius: hasPreviusDay ? 0 : 4,
      borderBottomLeftRadius: hasNextDay ? 0 : 4,
      borderBottomRightRadius: hasNextDay ? 0 : 4,
    };
  }, [event]);

  const _renderEventContent = () => {
    return (
      <Text
        allowFontScaling={theme.allowFontScaling}
        style={[styles.title, theme.eventTitle]}
      >
        {event.title}
      </Text>
    );
  };

  const eventOpacity = selectedEventId ? 0.5 : 1;

  return (
    <Animated.View
      style={[
        styles.eventBlock,
        { opacity: eventOpacity },
        event.containerStyle,
        eventStyle,
      ]}
    >
      <TouchableOpacity
        disabled={!!selectedEventId}
        delayLongPress={300}
        onPress={_onPress}
        onLongPress={_onLongPress}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: event.color || EVENT_DEFAULT_COLOR },
        ]}
        activeOpacity={0.6}
      >
        {renderEventContent
          ? renderEventContent(event, timeIntervalHeight)
          : _renderEventContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const areEqual = (prev: EventBlockProps, next: EventBlockProps) => {
  const { event: prevEvent, theme: prevTheme, ...prevOther } = prev;
  const { event: nextEvent, theme: nextTheme, ...nextOther } = next;
  const isSameEvent = isEqual(prevEvent, nextEvent);
  const isSameTheme = isEqual(prevTheme, nextTheme);
  const isSameOther = shallowEqual(prevOther, nextOther);
  return isSameEvent && isSameTheme && isSameOther;
};

export default memo(EventBlock, areEqual);

const styles = StyleSheet.create({
  eventBlock: {
    position: 'absolute',
    overflow: 'hidden',
  },
  title: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    fontSize: 10,
    color: DEFAULT_PROPS.BLACK_COLOR,
  },
  borderTop: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  borderBottom: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
