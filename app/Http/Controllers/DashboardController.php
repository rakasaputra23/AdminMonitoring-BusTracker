<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use App\Services\FirebaseService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    /**
     * Display dashboard page (Inertia)
     */
    public function index(): Response
    {
        try {
            $stats = $this->firebase->getDashboardStats();
            $buses = $this->firebase->getActiveBuses();

            return Inertia::render('Dashboard', [
                'stats' => $stats,
                'buses' => $buses,
                'googleMapsApiKey' => env('GOOGLE_MAPS_API_KEY'),
                // ✅ FIX: Pass user object dengan role
                'auth' => [
                    'user' => auth()->user()
                ],
            ]);
        } catch (\Exception $e) {
            return Inertia::render('Dashboard', [
                'stats' => [
                    'total_buses' => 0,
                    'active_buses' => 0,
                    'total_passengers' => 0,
                    'total_capacity' => 0,
                    'average_speed' => 0,
                ],
                'buses' => [],
                'googleMapsApiKey' => env('GOOGLE_MAPS_API_KEY'),
                // ✅ FIX: Pass user object dengan role
                'auth' => [
                    'user' => auth()->user()
                ],
                'error' => 'Firebase connection error: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * API: Get all buses data (for real-time updates)
     */
    public function getBusesData(): JsonResponse
    {
        try {
            $buses = $this->firebase->getActiveBuses();
            return response()->json([
                'success' => true,
                'data' => $buses
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * API: Get dashboard stats (for real-time updates)
     */
    public function getStats(): JsonResponse
    {
        try {
            $stats = $this->firebase->getDashboardStats();
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * API: Get single bus detail with track
     */
    public function getBusDetail($busId): JsonResponse
    {
        try {
            $bus = $this->firebase->getBus($busId);
            $track = $this->firebase->getBusTrack($busId);

            if (!$bus) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bus not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'bus' => $bus,
                    'track' => $track
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}