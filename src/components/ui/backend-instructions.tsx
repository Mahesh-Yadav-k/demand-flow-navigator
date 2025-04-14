
import React from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export function BackendInstructions() {
  return (
    <Alert className="my-4">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Backend Setup Instructions</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2 text-sm">
          <p>To use the FastAPI backend, follow these steps:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Install FastAPI and dependencies:
              <pre className="mt-1 bg-slate-100 p-2 rounded">
                pip install fastapi[all] sqlalchemy pydantic python-multipart uvicorn
              </pre>
            </li>
            <li>
              Start the backend server:
              <pre className="mt-1 bg-slate-100 p-2 rounded">
                uvicorn backend_code:app --reload
              </pre>
            </li>
            <li>
              The API will be available at <code>http://localhost:8000</code>
            </li>
            <li>
              API documentation will be available at <code>http://localhost:8000/docs</code>
            </li>
          </ol>
        </div>
      </AlertDescription>
    </Alert>
  );
}
