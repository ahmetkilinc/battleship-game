import React, { useState } from 'react';
import styled from 'styled-components';
import { Country } from '../types/game';

interface CountrySelectorProps {
  onSelect: (country: Country) => void;
  disabled?: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
`;

const CountryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  max-width: 600px;
  width: 100%;
`;

const CountryCard = styled.div<{ selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border: 2px solid ${({ selected }) => selected ? '#2ecc71' : '#ddd'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
`;

const Flag = styled.img`
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
`;

const CountryName = styled.span`
  font-size: 14px;
  text-align: center;
  color: #333;
`;

const Title = styled.h2`
  color: #2c3e50;
  margin-bottom: 20px;
`;

// Popüler ülkeler listesi
const countries: Country[] = [
  { code: 'TR', name: 'Türkiye', flag: 'https://flagcdn.com/tr.svg' },
  { code: 'US', name: 'United States', flag: 'https://flagcdn.com/us.svg' },
  { code: 'GB', name: 'United Kingdom', flag: 'https://flagcdn.com/gb.svg' },
  { code: 'DE', name: 'Germany', flag: 'https://flagcdn.com/de.svg' },
  { code: 'FR', name: 'France', flag: 'https://flagcdn.com/fr.svg' },
  { code: 'IT', name: 'Italy', flag: 'https://flagcdn.com/it.svg' },
  { code: 'ES', name: 'Spain', flag: 'https://flagcdn.com/es.svg' },
  { code: 'JP', name: 'Japan', flag: 'https://flagcdn.com/jp.svg' },
  { code: 'CN', name: 'China', flag: 'https://flagcdn.com/cn.svg' },
  { code: 'RU', name: 'Russia', flag: 'https://flagcdn.com/ru.svg' },
  { code: 'BR', name: 'Brazil', flag: 'https://flagcdn.com/br.svg' },
  { code: 'IN', name: 'India', flag: 'https://flagcdn.com/in.svg' },
];

const CountrySelector: React.FC<CountrySelectorProps> = ({ onSelect, disabled }) => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const handleCountrySelect = (country: Country) => {
    if (disabled) return;
    setSelectedCountry(country);
    onSelect(country);
  };

  return (
    <Container>
      <Title>Select Your Country</Title>
      <CountryGrid>
        {countries.map((country) => (
          <CountryCard
            key={country.code}
            selected={selectedCountry?.code === country.code}
            onClick={() => handleCountrySelect(country)}
          >
            <Flag src={country.flag} alt={`${country.name} flag`} />
            <CountryName>{country.name}</CountryName>
          </CountryCard>
        ))}
      </CountryGrid>
    </Container>
  );
};

export default CountrySelector; 