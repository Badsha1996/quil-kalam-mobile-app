import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const Card = ({ children, style }: CardProps) => {
  return (
    //  @ts-ignore
    <View>{children}</View>
  );
};

export default Card;
