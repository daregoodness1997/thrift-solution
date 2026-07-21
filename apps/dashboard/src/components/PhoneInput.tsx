"use client";

import { useState, useRef, useEffect } from "react";
import { config } from "@thrift/config";

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  maxLength: number;
}

const COUNTRIES: Country[] = [
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬", maxLength: 10 },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", maxLength: 10 },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", maxLength: 10 },
  { code: "GH", name: "Ghana", dialCode: "+233", flag: "🇬🇭", maxLength: 9 },
  { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪", maxLength: 9 },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦", maxLength: 9 },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳", maxLength: 10 },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", maxLength: 10 },
  { code: "AE", name: "UAE", dialCode: "+971", flag: "🇦🇪", maxLength: 9 },
  { code: "CM", name: "Cameroon", dialCode: "+237", flag: "🇨🇲", maxLength: 9 },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  label?: string;
  defaultCountry?: string;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = "Enter phone number",
  invalid = false,
  label = "Phone Number",
  defaultCountry = "NG",
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0]
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch("");
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith(country.dialCode.replace("+", ""))) {
      onChange(value);
    } else {
      onChange("");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/[^\d+]/g, "");
    const dialDigits = selectedCountry.dialCode.replace("+", "");

    if (digits.startsWith("+") && !digits.startsWith("+" + dialDigits)) {
      const cleanDigits = digits.replace(/\D/g, "");
      if (cleanDigits.startsWith(dialDigits)) {
        onChange("+" + dialDigits + cleanDigits.slice(dialDigits.length));
      } else {
        onChange("+" + dialDigits + cleanDigits);
      }
    } else if (!digits.startsWith("+") && digits.length > 0) {
      const cleanDigits = digits.replace(/\D/g, "");
      if (cleanDigits.startsWith(dialDigits)) {
        onChange("+" + dialDigits + cleanDigits.slice(dialDigits.length));
      } else {
        onChange("+" + dialDigits + cleanDigits);
      }
    } else {
      onChange(digits);
    }
  };

  const getFullValue = () => {
    if (!value) return "";
    const dialDigits = selectedCountry.dialCode.replace("+", "");
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith(dialDigits)) {
      return "+" + dialDigits + " " + digits.slice(dialDigits.length);
    }
    return value;
  };

  return (
    <div className="mb-5">
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      )}
      <div className="relative">
        <div
          className="flex items-center w-full py-[0.6875rem] rounded-[0.625rem] border text-[13px] text-brand-dark outline-none"
          style={{
            borderColor: invalid ? "#FECACA" : "#E5E7EB",
            paddingLeft: "0.5rem",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = config.colors.primary;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.primary}15`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = invalid ? "#FECACA" : "#E5E7EB";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-50 transition bg-none border-none cursor-pointer"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-xs font-medium text-gray-600">{selectedCountry.dialCode}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <input
            type="tel"
            value={getFullValue()}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            autoComplete="tel"
            className="flex-1 py-1 px-2 text-[13px] text-brand-dark outline-none bg-transparent"
          />
        </div>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden"
          >
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full py-2 px-3 rounded-lg border border-gray-200 text-xs outline-none"
                style={{
                  borderColor: "#E5E7EB",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = config.colors.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E5E7EB";
                }}
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition bg-none border-none cursor-pointer text-left"
                  style={{
                    backgroundColor:
                      country.code === selectedCountry.code ? `${config.colors.primary}08` : "transparent",
                  }}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1 text-xs font-medium text-gray-700">{country.name}</span>
                  <span className="text-xs text-gray-500">{country.dialCode}</span>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="px-3 py-4 text-xs text-gray-400 text-center">No countries found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
