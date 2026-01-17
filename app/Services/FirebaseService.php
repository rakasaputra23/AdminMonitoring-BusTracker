<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Database;
use Illuminate\Support\Facades\Log;

class FirebaseService
{
    protected $database;

    public function __construct()
    {
        try {
            $credentialsPath = storage_path(env('FIREBASE_CREDENTIALS', 'firebase-credentials.json'));
            $databaseUrl = env('FIREBASE_DATABASE_URL');

            if (!file_exists($credentialsPath)) {
                throw new \Exception("Firebase credentials file not found at: {$credentialsPath}");
            }

            $factory = (new Factory)
                ->withServiceAccount($credentialsPath)
                ->withDatabaseUri($databaseUrl);

            $this->database = $factory->createDatabase();
            
            Log::info('Firebase initialized successfully');
        } catch (\Exception $e) {
            Log::error('Firebase initialization error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get Firebase Database instance
     */
    public function getDatabase(): Database
    {
        return $this->database;
    }

    /**
     * Get all buses from Firebase
     */
    public function getAllBuses()
    {
        try {
            $buses = $this->database->getReference('buses')->getValue();
            return $buses ?? [];
        } catch (\Exception $e) {
            Log::error('Firebase getAllBuses error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get single bus by ID
     */
    public function getBus($busId)
    {
        try {
            return $this->database->getReference('buses/' . $busId)->getValue();
        } catch (\Exception $e) {
            Log::error('Firebase getBus error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get only active buses
     */
    public function getActiveBuses()
    {
        $buses = $this->getAllBuses();
        if (empty($buses)) return [];
        
        return array_filter($buses, function($bus) {
            return isset($bus['status']) && $bus['status'] === 'active';
        });
    }

    /**
     * Get dashboard statistics
     */
    public function getDashboardStats()
    {
        $buses = $this->getAllBuses();
        
        if (empty($buses)) {
            return [
                'total_buses' => 0,
                'active_buses' => 0,
                'total_passengers' => 0,
                'total_capacity' => 0,
                'average_speed' => 0,
            ];
        }

        $activeBuses = array_filter($buses, fn($bus) => 
            isset($bus['status']) && $bus['status'] === 'active'
        );
        
        $totalPassengers = array_reduce($buses, fn($carry, $bus) => 
            $carry + ($bus['currentPassengers'] ?? 0), 0
        );
        
        $totalCapacity = array_reduce($buses, fn($carry, $bus) => 
            $carry + ($bus['capacity'] ?? 0), 0
        );

        $totalSpeed = 0;
        $busesWithSpeed = 0;
        foreach ($buses as $bus) {
            if (isset($bus['location']['speed']) && $bus['location']['speed'] > 0) {
                $totalSpeed += $bus['location']['speed'];
                $busesWithSpeed++;
            }
        }

        return [
            'total_buses' => count($buses),
            'active_buses' => count($activeBuses),
            'total_passengers' => $totalPassengers,
            'total_capacity' => $totalCapacity,
            'average_speed' => $busesWithSpeed > 0 ? round($totalSpeed / $busesWithSpeed, 1) : 0,
        ];
    }

    /**
     * Get bus tracking history
     */
    public function getBusTrack($busId)
    {
        try {
            $track = $this->database->getReference('buses/' . $busId . '/track')->getValue();
            return $track ? array_values($track) : [];
        } catch (\Exception $e) {
            Log::error('Firebase getBusTrack error: ' . $e->getMessage());
            return [];
        }
    }
}