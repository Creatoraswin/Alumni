"use client";


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const PendingUpdatesTab = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Mock pending updates data
  const pendingUpdates = [
    {
      id: "1",
      studentName: "John Smith",
      field: "Current Job",
      oldValue: "Software Engineer at Google",
      newValue: "Senior Software Engineer at Microsoft",
      submittedAt: "2024-01-15T10:30:00Z",
      status: "pending"
    },
    {
      id: "2",
      studentName: "Sarah Johnson",
      field: "Location",
      oldValue: "New York, NY",
      newValue: "San Francisco, CA",
      submittedAt: "2024-01-14T14:20:00Z",
      status: "pending"
    },
    {
      id: "3",
      studentName: "Mike Davis",
      field: "Bio",
      oldValue: "Passionate developer",
      newValue: "Passionate full-stack developer with 5 years of experience in React and Node.js",
      submittedAt: "2024-01-13T09:15:00Z",
      status: "approved"
    }
  ];

  const filteredUpdates = pendingUpdates.filter(update => 
    selectedFilter === "all" || update.status === selectedFilter
  );

  const handleApprove = (updateId: string) => {

  };

  const handleReject = (updateId: string) => {

  };

  const totalPending = pendingUpdates.filter(u => u.status === "pending").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Profile Update Requests</CardTitle>
        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Updates</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredUpdates.map((update) => (
            <div key={update.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h4 className="font-semibold">{update.studentName}</h4>
                  <Badge variant="outline">{update.field}</Badge>
                  <Badge 
                    variant={
                      update.status === "pending" ? "default" :
                      update.status === "approved" ? "secondary" : "destructive"
                    }
                  >
                    {update.status}
                  </Badge>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(update.submittedAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-600">Current:</p>
                  <p className="bg-red-50 p-2 rounded border">{update.oldValue}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-600">Proposed:</p>
                  <p className="bg-green-50 p-2 rounded border">{update.newValue}</p>
                </div>
              </div>
              
              {update.status === "pending" && (
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleApprove(update.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleReject(update.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          {filteredUpdates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4" />
              <p>No updates found for the selected filter.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingUpdatesTab;
