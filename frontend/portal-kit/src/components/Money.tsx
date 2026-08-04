import React from "react";

type Props = {
  amount: string;
};

export function Money({ amount }: Props) {
  return <span>{amount}</span>;
}
