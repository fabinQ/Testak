import { useState } from "react";

const people = [
  { firstName: "John", tel: "123-456-7890", city: "New York" },
  { firstName: "Jane", tel: "987-654-3210", city: "Los Angeles" },
  { firstName: "Alice", tel: "555-123-4567", city: "Chicago" },
];

const Tel = ({ tel }: { tel: string }) => <a href={`tel:${tel}`}>Tel {tel}</a>;

const PersonData = (props: {
  person: { firstName: string; tel: string; city: string };
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const buttonElement = (
    <button onClick={() => setIsExpanded(!isExpanded)}>
      {isExpanded ? "Ukryj" : "Pokaż"}
    </button>
  );
  return (
    <>
      <h2>{props.person.firstName}</h2>
      {buttonElement}
      {isExpanded && (
        <>
          <h3>
            <Tel tel={props.person.tel}></Tel>
          </h3>
          {props.person.city && <h3>Miasto: {props.person.city}</h3>}
        </>
      )}
    </>
  );
};

// let counter = 0;
export const RandomUseStade = () => {
  //   counter++;
  const random = Math.floor(Math.random() * 100);
  //   console.log(`Random ${counter}:`, random);
  const [current, setCurrent] = useState(random);
  //   console.log(`Current ${counter}:`, current);
  const buttonElement = (
    <button onClick={() => setCurrent(random)}>{current}</button>
  );
  return <>{buttonElement}</>;
};

export const PersonInfo = (
  <>
    <h1>Lista Kontaktów</h1>
    {people.map((person) => (
      <PersonData key={person.tel} person={person} />
    ))}
  </>
);
