import "../../styles/AutoCompleteInput.scss";
import PropTypes from "prop-types";
import { useState } from "react";
import getPlaces from "./getPlaces";

AutoCompleteInput.propTypes = {
    handleManualInputChange: PropTypes.func.isRequired,
    setAddress: PropTypes.func.isRequired,
    streetAndNumber: PropTypes.string.isRequired,
    inputStyle: PropTypes.object,
  };

export default function AutoCompleteInput({handleManualInputChange, setAddress, streetAndNumber, inputStyle}) {

  const [suggestions, setSuggestions] = useState([]);

  const handleChange = (event) => {
    handleManualInputChange(event, "streetAndNumber");
    handleInputChange(event.target.value);
  };

  const handleInputChange = async (query) => {
    const suggestions = await getPlaces(query);
    setSuggestions(suggestions);
  };

  const handleSuggestionClick = (suggestion) => {
    const streetAndNumber = suggestion.place_name.split(",")[0];
    const latitude = suggestion.center[1];
    const longitude = suggestion.center[0];

    const address = {
      streetAndNumber,
      place: "",
      region: "",
      postcode: "",
      country: "",
      latitude,
      longitude,
    };

    suggestion.context.forEach((element) => {
      const identifier = element.id.split(".")[0];

      address[identifier] = element.text;
    });

   

    setAddress(address);
    setSuggestions([]);
  };



  

    return <div>
        <div className="autoCompleteInputContainer">
            <input
                id="address"
                type="text"
                placeholder="Address"
                value={streetAndNumber}
                onChange={handleChange}
                style={inputStyle}
            />
            {suggestions.length > 0 && (
              <ul className="addressSuggestions">
                {suggestions.map((suggestion, index) => (
                  <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                    {suggestion.place_name}
                  </li>
                ))}
              </ul>
            )}

        </div>
    </div>;
}
