"use client";

import React, { useState, useEffect } from "react";
// import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "1rem"
};

const defaultCenter = {
  lat: 21.028511,
  lng: 105.804817 // Hanoi
};

export function FacilitiesMap({ facilities = [] }: { facilities?: any[] }) {
  const [activeFacility, setActiveFacility] = useState<any>(null);

  // Return a skeleton if Google Maps is not fully set up yet
  return (
    <div className="relative w-full h-[500px] bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700">
      <div className="text-center p-6">
        <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Bản đồ Cơ sở vật chất Thể thao</h3>
        <p className="text-slate-500 mb-4">Đang tải Google Maps API...</p>
        <div className="animate-pulse flex justify-center">
          <div className="w-12 h-12 bg-blue-200 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* 
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={12}
        >
          {facilities.map((facility) => (
            <Marker
              key={facility.id}
              position={{ lat: facility.lat, lng: facility.lng }}
              onClick={() => setActiveFacility(facility)}
              icon={{
                url: facility.accessibility_features?.wheelchair_accessible 
                  ? "/icons/accessible-pin.png" 
                  : "/icons/standard-pin.png"
              }}
            />
          ))}

          {activeFacility && (
            <InfoWindow
              position={{ lat: activeFacility.lat, lng: activeFacility.lng }}
              onCloseClick={() => setActiveFacility(null)}
            >
              <div className="p-2 max-w-[200px] text-slate-800">
                <h4 className="font-bold text-sm mb-1">{activeFacility.name}</h4>
                <p className="text-xs text-slate-600 mb-2">{activeFacility.address}</p>
                {activeFacility.accessibility_features?.wheelchair_accessible && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Có lối cho xe lăn
                  </span>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript> 
      */}
    </div>
  );
}
