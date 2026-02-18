import { useState } from "react";

export const initialPeople = [
  { firstName: "John", tel: "123-456-7890", city: "New York" },
  { firstName: "Jane", tel: "987-654-3210", city: "Los Angeles" },
  { firstName: "Alice", tel: "555-123-4567", city: "Chicago" },
];

const Tel = ({ tel }: { tel: string }) => <a href={`tel:${tel}`}>Tel {tel}</a>;

const PersonData = ({
  person,
  onDelete,
  onEdit,
}: {
  person: { firstName: string; tel: string; city: string };
  onDelete?: (tel: string) => void;
  onEdit?: (tel: string, newName: string, newCity: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const buttonElement = (
    <>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? "Ukryj" : "Pokaż"}
      </button>
      {isExpanded && (
        <button
          onClick={() => {
            if (onDelete) {
              if (window.confirm(`Usunąć ${person.firstName}?`)) {
                onDelete(person.tel);
              }
            } else {
              window.alert(`Usuwasz ${person.firstName}`);
            }
          }}
        >
          Usuń
        </button>
      )}
      {isExpanded && <button onClick={() => {}}>Edytuj</button>}
    </>
  );
  return (
    <>
      <h2>{person.firstName}</h2>
      {buttonElement}
      {isExpanded && (
        <>
          <h3>
            <Tel tel={person.tel}></Tel>
          </h3>
          {person.city && <h3>Miasto: {person.city}</h3>}
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

export function PersonInfo({
  people,
  onDelete,
  onEdit,
}: {
  people: { firstName: string; tel: string; city: string }[];
  onDelete?: (tel: string) => void;
  onEdit?: (tel: string, newName: string, newCity: string) => void;
}) {
  return (
    <>
      <h1>Lista Kontaktów</h1>
      {people.map((p) => (
        <PersonData key={p.tel} person={p} onDelete={onDelete} />
      ))}
    </>
  );
}
