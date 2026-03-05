import { useState } from "react";
import "./PersonalInfo.css"

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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(person.firstName);
  const [editTel, setEditTel] = useState(person.tel);
  const [editCity, setEditCity] = useState(person.city);

  const buttonElement = (
    <>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? "Ukryj" : "Pokaż"}
      </button>
      {isExpanded && (
        <>
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
        <button
          onClick={() => {
            if (isEditing) {
              if (onEdit) {
                onEdit(editTel, editName, editCity);
              }
              setIsEditing(false);
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? "Wyślij" : "Edytuj"}
        </button>
      </>
      )}
    </>
  );
  return (
    <li>
    {isEditing?
    (
      <>
        <h2><input value={editName} onChange={(e) => setEditName(e.target.value)} /></h2>
        {buttonElement}
        {isExpanded && (
          <>
            <h3>
              {person.tel}
            </h3>
            {person.city && <h3>Miasto: <input value={editCity} onChange={(e) => setEditCity(e.target.value)} /></h3>}
          </>
        )}        
      </>
    ):(
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
    )}
    </li>
    )
}



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
        <PersonData
          key={p.tel}
          person={p}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </>
  );
}
