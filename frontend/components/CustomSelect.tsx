"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

const CustomSelect = ({ options, value, onChange, placeholder = "Select an option", isSearchable = true }: {
    options: { value: string; label: string; icon: ReactNode; searchable_fields?: string[] }[],
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    isSearchable?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const selectedOption = options.find(option => option.value === value);
    const selectRef = useRef<HTMLDivElement>(null);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm("");
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const filteredOptions = useMemo(() => {
        if (!searchTerm || !isSearchable) {
            return options;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        return options.filter(option => {
            const labelMatch = option.label.toLowerCase().includes(lowercasedFilter);
            const fieldsMatch = option.searchable_fields?.some(field =>
                field.toLowerCase().includes(lowercasedFilter)
            ) || false;
    
            return labelMatch || fieldsMatch;
        });
    }, [searchTerm, options, isSearchable]);


    return (
        <div className="relative w-full" ref={selectRef}>
            {/* Selected Value Display */}
            <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOption ? (
                    <span className="flex items-center">
                        {selectedOption.icon}
                        <span className="ml-3">{selectedOption.label}</span>
                    </span>
                ) : (
                    <span className="text-gray-500">{placeholder}</span>
                )}
                <svg
                    className={`h-5 w-5 transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {/* Dropdown Options */}
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg focus:outline-none">
                    {isSearchable && (
                        <div className="p-2">
                            <input
                                type="text"
                                placeholder="ค้นหา..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-orange-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                    <ul className="max-h-52 overflow-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <li
                                    key={option.value}
                                    className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-100 text-gray-800"
                                    onClick={() => handleSelect(option.value)}
                                >
                                    {option.icon}
                                    <span className="ml-3">{option.label}</span>
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-3 text-gray-500 text-center">ไม่พบข้อมูล</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
