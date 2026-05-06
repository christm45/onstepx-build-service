// SmartWebServer Config.h — SWS round-trip CI test
// Exercises all new network-credentials defines from commit 40d2c72
// (christm45/OnStepX-Configurator generateSWSConfig())

#define HOST_NAME                    "sws-roundtrip"
#define OPERATIONAL_MODE                       WIFI
#define SERIAL_BAUD_DEFAULT                    9600
#define SERIAL_BAUD                          115200
#define SERIAL_SWAP                            AUTO
#define BLE_GAMEPAD                             OFF
#define BLE_GP_ADDR              "ff:ff:de:09:f5:cf"
#define BLE_GP_ADDR1             "ff:ff:ff:ff:ff:ff"
#define LED_STATUS                               ON
#define DISPLAY_LANGUAGE                       L_en
#define DISPLAY_WEATHER                          ON
#define DISPLAY_INTERNAL_TEMPERATURE            OFF
#define DISPLAY_RESET_CONTROLS                   ON
#define DISPLAY_COORDINATE_ORIGIN               OFF
#define DISPLAY_SERVO_MONITOR                   OFF
#define ENC_AUTO_SYNC_DEFAULT                    ON
#define ENC_AUTO_SYNC_MEMORY                    OFF
#define ENC_SYNC_DURING_GOTO                    OFF
#define AXIS1_ENCODER                           OFF
#define AXIS1_ENCODER_TICKS_DEG            22.22222
#define AXIS1_ENCODER_REVERSE                   OFF
#define AXIS1_ENCODER_DIFF_LIMIT_TO             300
#define AXIS1_ENCODER_DIFF_LIMIT_FROM           OFF
#define AXIS2_ENCODER                           OFF
#define AXIS2_ENCODER_TICKS_DEG            22.22222
#define AXIS2_ENCODER_REVERSE                   OFF
#define AXIS2_ENCODER_DIFF_LIMIT_TO             300
#define AXIS2_ENCODER_DIFF_LIMIT_FROM           OFF

// --- Network credentials block (new in configurator commit 40d2c72) ---
#define DEBUG                                   OFF
#define SERIAL_DEBUG                         Serial
#define SERIAL_DEBUG_BAUD                      9600
#define NV_WIPE                                 OFF
#define PASSWORD_DEFAULT               "changeme123"
#define AP_ENABLED                             true
#define AP_PASSWORD                      "apsecret8"
#define AP_CHANNEL                                7
#define AP_IP_ADDR                     {192,168,0,1}
#define AP_GW_ADDR                     {192,168,0,1}
#define AP_SN_MASK                   {255,255,255,0}
#define STA_ENABLED                           false
#define STA_PASSWORD                    "stasecret8"
#define STA_DHCP_ENABLED                       true
#define STA_IP_ADDR                   {192,168,1,55}
#define STA_GW_ADDR                    {192,168,1,1}
#define STA_SN_MASK                  {255,255,255,0}
#define MAC             {0xDE,0xAD,0xBE,0xEF,0xFE,0xEE}

#define FileVersionConfig 6
#include "Extended.config.h"
