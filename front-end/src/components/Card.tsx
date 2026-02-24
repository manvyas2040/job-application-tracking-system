import { ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
};

export default function Card({ title, children }: Props) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
