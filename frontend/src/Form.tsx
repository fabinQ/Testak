import { useEffect, useState } from "react";


const addPerson = () => { 
    console.log("Dodano nową osobę");
  }
  
const Form = (props:{onAddPerson: () => void}) => {
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [city, setCity] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        console.log({ name, tel, city });
        props.onAddPerson();
      }}
    >
      <div>
        <input
          type="text"
          defaultValue={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          name="name"
          placeholder="Imię"
        />
      </div>
      <div>
        <input
          type="text"
          defaultValue={tel}
          onChange={(e) => {
            setTel(e.target.value);
          }}
          name="tel"
          placeholder="Numer telefonu"
        />
      </div>
      <div>
        <input
          type="text"
          defaultValue={city}
          onChange={(e) => {
            setCity(e.target.value);
          }}
          name="city"
          placeholder="Miasto"
        />
      </div>
      <button disabled={name === "" || tel === "" || city === ""} type="submit">
        Dodaj kontakt
      </button>
    </form>
  );
};

export function Formularz() {
  const [isFormShown, setIsFromShown] = useState(false);
  return (
    <>
      <button onClick={() => setIsFromShown(!isFormShown)}>
        {isFormShown ? "Ukryj formularz" : "Pokaż formularz"}
      </button>
      {isFormShown && <Form onAddPerson={addPerson}/>}
    </>
  );
}
