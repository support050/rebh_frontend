export function MapTab() {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 flex items-center justify-center h-[700px]">
            <div className="text-center text-gray-500">
                <h3 className="text-lg font-semibold mb-2">RS Range Map</h3>
                <p className="text-sm">This tab will contain the interactive d3.js map.</p>
            </div>
        </div>
    );
}

export function EventsTab() {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 flex items-center justify-center h-[700px]">
            <div className="text-center text-gray-500">
                <h3 className="text-lg font-semibold mb-2">Events</h3>
                <p className="text-sm">This tab will list significant changes this week.</p>
            </div>
        </div>
    );
}
