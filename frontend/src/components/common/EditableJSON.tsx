import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface EditableJSONProps {
    data: Record<string, unknown>;
    onChange: (updated: Record<string, unknown>) => void;
}

export function EditableJSON({ data, onChange }: EditableJSONProps) {
    const [local, setLocal] = useState<Record<string, unknown>>(data);

    const updateField = (key: string, value: string) => {
        const updated = { ...local, [key]: value };
        setLocal(updated);
        onChange(updated);
    };

    const deleteField = (key: string) => {
        const updated = { ...local };
        delete updated[key];
        setLocal(updated);
        onChange(updated);
    };

    const addField = () => {
        const newKey = prompt("Enter new key:");
        if (!newKey) return;

        const updated = { ...local, [newKey]: "" };
        setLocal(updated);
        onChange(updated);
    };

    return (
        <div className="space-y-3">
            {Object.entries(local).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                    <Input
                        value={key}
                        className="w-40"
                        readOnly
                    />

                    <Input
                        value={value as string}
                        onChange={(e) => updateField(key, e.target.value)}
                        className="flex-1"
                    />

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteField(key)}
                    >
                        Delete
                    </Button>
                </div>
            ))}

            <Button onClick={addField} variant="outline">
                Add Field
            </Button>
        </div>
    );
}
