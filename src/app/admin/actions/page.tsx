
"use client";
import ElectionActions from "@/components/election-actions";

export default function ActionsPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">Election Actions</h1>
            <p className="text-muted-foreground mb-8">Perform secure, high-privilege actions like closing the election.</p>
            <ElectionActions />
        </div>
    );
}
