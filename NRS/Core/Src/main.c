/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : WiFi AP Server + TCP Client + LSM303DLHC Accelerometer
  ******************************************************************************
  * @attention
  *
  * Copyright (c) 2026 STMicroelectronics.
  * All rights reserved.
  ******************************************************************************
  */
/* USER CODE END Header */

/* Includes ------------------------------------------------------------------*/
#include "main.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */
#include "string.h"
#include "stdio.h"
/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */
typedef enum {
  ESP_RES_OK = 0,
  ESP_RES_ERROR,
  ESP_RES_TIMEOUT
} esp_result_t;

typedef enum {
  MODE_AP_SERVER = 0,  // Privzeto: AP strežnik za nastavitev
  MODE_TCP_CLIENT      // Po nastavitvi: TCP klient za pošiljanje
} operation_mode_t;
/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */
/* --- PRIVZETE NASTAVITVE (uporabljajo se samo v AP načinu) --- */
#define DEFAULT_AP_SSID "STM32_ESP"
#define DEFAULT_AP_PASS "12345678"

/* --- TCP SERVER NASTAVITVE --- */
#define TCP_HOST  "192.168.2.162"
#define TCP_PORT  8080

/* ESP PARAMETRI */
#define ESP_RX_BUFFER_SIZE 1024U
#define ESP_CMD_TIMEOUT_MS 2000U
#define ESP_WIFI_TIMEOUT_MS 25000U
#define ESP_TCP_TIMEOUT_MS 10000U

/* --- LSM303DLHC DEFINICIJE --- */
#define LSM303DLHC_ACC_ADDR  (0x19 << 1)
#define CTRL_REG1_A   0x20
#define CTRL_REG4_A   0x23
#define STATUS_REG_A  0x27
#define OUT_X_L_A     0x28
#define OUT_X_H_A     0x29
#define OUT_Y_L_A     0x2A
#define OUT_Y_H_A     0x2B
#define OUT_Z_L_A     0x2C
#define OUT_Z_H_A     0x2D
#define WHO_AM_I_A    0x0F
/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */
/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/
I2C_HandleTypeDef hi2c1;
SPI_HandleTypeDef hspi1;
UART_HandleTypeDef huart1;
UART_HandleTypeDef huart2;

/* USER CODE BEGIN PV */
// === GLOBALNE SPREMENLJIVKE ===
static operation_mode_t current_mode = MODE_AP_SERVER;
static char esp_rx_buffer[ESP_RX_BUFFER_SIZE];
char buffer[150];
char rx_data[512];
char ssid_configured[32] = "";
char pass_configured[32] = "";

// LED krouženje (S, SV, V, JV, J, JZ, Z, SZ)
uint16_t LED_CIRCLE[] = {LD3_Pin, LD5_Pin, LD7_Pin, LD9_Pin, LD10_Pin, LD8_Pin, LD6_Pin, LD4_Pin};

// HTML za nastavitev WiFi
char html_form[] = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n"
                  "<html><body>"
                  "<h2>ESP32 WiFi Konfiguracija</h2>"
                  "<form action='/set'>"
                  "Ime (SSID): <input type='text' name='s'><br>"
                  "Geslo: <input type='text' name='p'><br>"
                  "<input type='submit' value='Povezi'>"
                  "</form></body></html>";

char success_msg[] = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n"
                    "<html><body><h1>Podatki prejeti!</h1>"
                    "<p>Povezujem na WiFi... opazuj lucke na STM32.</p></body></html>";

// === SENZOR ===
int16_t accel_x, accel_y, accel_z;
uint8_t sensor_data[6];
uint8_t whoami = 0;
/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/
void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_I2C1_Init(void);
static void MX_SPI1_Init(void);
static void MX_USART1_UART_Init(void);
static void MX_USART2_UART_Init(void);

/* USER CODE BEGIN PFP */
// === ESP FUNKCIJE ===
void ESP_Send(char *cmd);
void ESP_Init_AP_Mode(void);
uint8_t ESP_Connect_To_WiFi(char *s, char *p);
void Turn_Off_All_LEDs(void);

static void esp_set_leds(uint8_t at_ok, uint8_t wifi_ok, uint8_t tcp_ok, uint8_t send_ok);
static void esp_uart_flush(void);
static esp_result_t esp_wait_for(const char *ok1, const char *ok2, uint32_t timeout_ms);
static esp_result_t esp_send_cmd(const char *cmd, const char *ok1, const char *ok2, uint32_t timeout_ms);
static HAL_StatusTypeDef esp_setup_wifi_client(void);
static HAL_StatusTypeDef esp_open_tcp(void);
static HAL_StatusTypeDef esp_send_payload(const char *payload);

// === SENZOR ===
static void LSM303DLHC_Init(void);
static void LSM303DLHC_Read_Accel(void);
/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

// ============================================================================
// SENZOR - LSM303DLHC
// ============================================================================
void LSM303DLHC_Init(void)
{
  HAL_StatusTypeDef status;
  uint8_t config;

  status = HAL_I2C_Mem_Read(&hi2c1, LSM303DLHC_ACC_ADDR, WHO_AM_I_A, 1, &whoami, 1, 1000);

  config = 0x57; // 50Hz, Enable X/Y/Z
  HAL_I2C_Mem_Write(&hi2c1, LSM303DLHC_ACC_ADDR, CTRL_REG1_A, 1, &config, 1, 1000);
  HAL_Delay(10);

  config = 0x88; // Block Data Update, High Resolution
  HAL_I2C_Mem_Write(&hi2c1, LSM303DLHC_ACC_ADDR, CTRL_REG4_A, 1, &config, 1, 1000);
  HAL_Delay(10);
}

void LSM303DLHC_Read_Accel(void)
{
  HAL_StatusTypeDef status;
  status = HAL_I2C_Mem_Read(&hi2c1, LSM303DLHC_ACC_ADDR, OUT_X_L_A | 0x80, 1, sensor_data, 6, 1000);

  if(status == HAL_OK)
  {
    accel_x = (int16_t)((sensor_data[1] << 8) | sensor_data[0]);
    accel_y = (int16_t)((sensor_data[3] << 8) | sensor_data[2]);
    accel_z = (int16_t)((sensor_data[5] << 8) | sensor_data[4]);

    accel_x = accel_x >> 4;
    accel_y = accel_y >> 4;
    accel_z = accel_z >> 4;
  }
}

// ============================================================================
// AP SERVER MODE (za nastavitev WiFi)
// ============================================================================
void Turn_Off_All_LEDs(void) {
    for(int i=0; i<8; i++) {
        HAL_GPIO_WritePin(GPIOE, LED_CIRCLE[i], GPIO_PIN_RESET);
    }
}

void ESP_Send(char *cmd) {
    HAL_UART_Transmit(&huart1, (uint8_t *)cmd, strlen(cmd), 1000);
    HAL_Delay(500);
}

void ESP_Init_AP_Mode(void) {
    ESP_Send("AT+RST\r\n");
    HAL_Delay(2000);
    ESP_Send("AT+CWMODE=3\r\n"); // AP + Station mode
    HAL_Delay(500);

    sprintf(buffer, "AT+CWSAP=\"%s\",\"%s\",5,3\r\n", DEFAULT_AP_SSID, DEFAULT_AP_PASS);
    ESP_Send(buffer);
    HAL_Delay(500);

    ESP_Send("AT+CIPMUX=1\r\n");
    ESP_Send("AT+CIPSERVER=1,80\r\n");
}

uint8_t ESP_Connect_To_WiFi(char *s, char *p) {
    char cmd[128];
    int led_index = 0;
    uint32_t last_led_update = 0;
    uint32_t start_time = HAL_GetTick();
    size_t len = 0;
    uint8_t ch = 0;

    // Odklopi se od prejšnjih omrežij
    HAL_UART_Transmit(&huart1, (uint8_t *)"AT+CWQAP\r\n", 10, 1000);
    HAL_Delay(1000);

    // Počisti buffer
    while (HAL_UART_Receive(&huart1, &ch, 1, 10) == HAL_OK);

    // Pošlji ukaz za povezavo
    sprintf(cmd, "AT+CWJAP=\"%s\",\"%s\"\r\n", s, p);
    HAL_UART_Transmit(&huart1, (uint8_t *)cmd, strlen(cmd), 1000);

    memset(esp_rx_buffer, 0, sizeof(esp_rx_buffer));
    len = 0;
    last_led_update = HAL_GetTick();

    // Čakanje do 25 sekund
    while ((HAL_GetTick() - start_time) < 25000) {

        // LED animacija vsako 150ms
        if ((HAL_GetTick() - last_led_update) >= 150) {
            HAL_GPIO_WritePin(GPIOE, LED_CIRCLE[led_index], GPIO_PIN_RESET);
            led_index++;
            if(led_index >= 8) led_index = 0;
            HAL_GPIO_WritePin(GPIOE, LED_CIRCLE[led_index], GPIO_PIN_SET);
            last_led_update = HAL_GetTick();
        }

        // Branje odgovora
        if (HAL_UART_Receive(&huart1, &ch, 1, 10) == HAL_OK) {
            if (len < (ESP_RX_BUFFER_SIZE - 1U)) {
                esp_rx_buffer[len++] = (char)ch;
                esp_rx_buffer[len] = '\0';
            }

            // Preveri uspeh
            if (strstr(esp_rx_buffer, "WIFI CONNECTED") ||
                strstr(esp_rx_buffer, "WIFI GOT IP")) {
                HAL_Delay(500);
                return 1; // USPEH
            }

            // Preveri napako
            if (strstr(esp_rx_buffer, "FAIL") ||
                strstr(esp_rx_buffer, "+CWJAP:")) {
                HAL_Delay(500);
                return 0; // NAPAKA
            }
        }
    }

    return 0; // TIMEOUT
}

// ============================================================================
// TCP CLIENT MODE (za pošiljanje podatkov)
// ============================================================================
static void esp_set_leds(uint8_t at_ok, uint8_t wifi_ok, uint8_t tcp_ok, uint8_t send_ok)
{
  HAL_GPIO_WritePin(GPIOE, LD3_Pin, at_ok ? GPIO_PIN_SET : GPIO_PIN_RESET);
  HAL_GPIO_WritePin(GPIOE, LD5_Pin, wifi_ok ? GPIO_PIN_SET : GPIO_PIN_RESET);
  HAL_GPIO_WritePin(GPIOE, LD7_Pin, tcp_ok ? GPIO_PIN_SET : GPIO_PIN_RESET);
  HAL_GPIO_WritePin(GPIOE, LD9_Pin, send_ok ? GPIO_PIN_SET : GPIO_PIN_RESET);
}

static void esp_uart_flush(void)
{
  uint8_t ch = 0;
  while (HAL_UART_Receive(&huart1, &ch, 1, 0) == HAL_OK) {}
}

static esp_result_t esp_wait_for(const char *ok1, const char *ok2, uint32_t timeout_ms)
{
  uint32_t start = HAL_GetTick();
  size_t len = 0;
  uint8_t ch = 0;
  memset(esp_rx_buffer, 0, sizeof(esp_rx_buffer));

  while ((HAL_GetTick() - start) < timeout_ms) {
    if (HAL_UART_Receive(&huart1, &ch, 1, 5) == HAL_OK) {
      if (len < (ESP_RX_BUFFER_SIZE - 1U)) {
        esp_rx_buffer[len++] = (char)ch;
        esp_rx_buffer[len] = '\0';
      }
      if (strstr(esp_rx_buffer, "ERROR") || strstr(esp_rx_buffer, "FAIL")) return ESP_RES_ERROR;
      if ((ok1 && strstr(esp_rx_buffer, ok1)) || (ok2 && strstr(esp_rx_buffer, ok2))) return ESP_RES_OK;
    }
  }
  return ESP_RES_TIMEOUT;
}

static esp_result_t esp_send_cmd(const char *cmd, const char *ok1, const char *ok2, uint32_t timeout_ms)
{
  esp_uart_flush();
  if (HAL_UART_Transmit(&huart1, (uint8_t *)cmd, strlen(cmd), HAL_MAX_DELAY) != HAL_OK) return ESP_RES_ERROR;
  return esp_wait_for(ok1, ok2, timeout_ms);
}

static HAL_StatusTypeDef esp_setup_wifi_client(void)
{
  char cmd[128];

  // Preklopimo v Station mode (client)
  if (esp_send_cmd("AT+CWMODE=1\r\n", "OK", NULL, ESP_CMD_TIMEOUT_MS) != ESP_RES_OK) return HAL_ERROR;
  HAL_Delay(500);

  snprintf(cmd, sizeof(cmd), "AT+CWJAP=\"%s\",\"%s\"\r\n", ssid_configured, pass_configured);
  if (esp_send_cmd(cmd, "WIFI GOT IP", "OK", ESP_WIFI_TIMEOUT_MS) != ESP_RES_OK) return HAL_ERROR;

  if (esp_send_cmd("AT+CIPMUX=0\r\n", "OK", NULL, ESP_CMD_TIMEOUT_MS) != ESP_RES_OK) return HAL_ERROR;
  return HAL_OK;
}

static HAL_StatusTypeDef esp_open_tcp(void)
{
  char cmd[128];
  snprintf(cmd, sizeof(cmd), "AT+CIPSTART=\"TCP\",\"%s\",%u\r\n", TCP_HOST, TCP_PORT);
  if (esp_send_cmd(cmd, "CONNECT", "OK", ESP_TCP_TIMEOUT_MS) != ESP_RES_OK) return HAL_ERROR;
  return HAL_OK;
}

static HAL_StatusTypeDef esp_send_payload(const char *payload)
{
  char cmd[32];
  size_t len = strlen(payload);
  snprintf(cmd, sizeof(cmd), "AT+CIPSEND=%lu\r\n", (unsigned long)len);
  if (esp_send_cmd(cmd, ">", NULL, ESP_CMD_TIMEOUT_MS) != ESP_RES_OK) return HAL_ERROR;
  if (HAL_UART_Transmit(&huart1, (uint8_t *)payload, len, HAL_MAX_DELAY) != HAL_OK) return HAL_ERROR;
  if (esp_wait_for("SEND OK", NULL, ESP_CMD_TIMEOUT_MS) != ESP_RES_OK) return HAL_ERROR;
  return HAL_OK;
}

/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{
  /* USER CODE BEGIN 1 */
  /* USER CODE END 1 */

  HAL_Init();
  SystemClock_Config();

  MX_GPIO_Init();
  MX_I2C1_Init();
  MX_SPI1_Init();
  MX_USART1_UART_Init();
  MX_USART2_UART_Init();

  /* USER CODE BEGIN 2 */

  // === INICIALIZACIJA SENZORJA ===
  HAL_Delay(1000);
  LSM303DLHC_Init();

  // === ZAČETNI NAČIN: AP SERVER ===
  HAL_GPIO_WritePin(GPIOE, LD3_Pin, GPIO_PIN_SET); // Rdeča = inicializacija
  ESP_Init_AP_Mode();
  HAL_GPIO_WritePin(GPIOE, LD3_Pin, GPIO_PIN_RESET);
  HAL_GPIO_WritePin(GPIOE, LD6_Pin, GPIO_PIN_SET); // Zelena = Server Ready

  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */
  while (1)
  {
    if (current_mode == MODE_AP_SERVER)
    {
      // =========== AP SERVER MODE ===========
      memset(rx_data, 0, sizeof(rx_data));

      if (HAL_UART_Receive(&huart1, (uint8_t *)rx_data, 511, 500) == HAL_OK || strlen(rx_data) > 0) {
        if (strstr(rx_data, "+IPD")) {

          // 1. Uporabnik je poslal podatke
          if (strstr(rx_data, "GET /set?")) {
            HAL_GPIO_WritePin(GPIOE, LD4_Pin, GPIO_PIN_SET); // Modra ON

            char *s_ptr = strstr(rx_data, "s=") + 2;
            char *s_end = strchr(s_ptr, '&');
            char *p_ptr = strstr(rx_data, "p=") + 2;
            char *p_end = strchr(p_ptr, ' ');
            if (p_end == NULL) p_end = strchr(p_ptr, '&');

            if (s_ptr && s_end && p_ptr && p_end) {
              int s_len = s_end - s_ptr;
              if(s_len > 31) s_len = 31;
              strncpy(ssid_configured, s_ptr, s_len);
              ssid_configured[s_len] = '\0';
              for(int i = 0; i < s_len; i++) if(ssid_configured[i] == '+') ssid_configured[i] = ' ';

              int p_len = p_end - p_ptr;
              if(p_len > 31) p_len = 31;
              strncpy(pass_configured, p_ptr, p_len);
              pass_configured[p_len] = '\0';
              for(int i = 0; i < p_len; i++) if(pass_configured[i] == '+') pass_configured[i] = ' ';

              // Odgovor brskalniku
              sprintf(buffer, "AT+CIPSEND=0,%d\r\n", (int)strlen(success_msg));
              HAL_UART_Transmit(&huart1, (uint8_t *)buffer, strlen(buffer), 100);
              HAL_Delay(100);
              HAL_UART_Transmit(&huart1, (uint8_t *)success_msg, strlen(success_msg), 500);
              HAL_Delay(500);
              HAL_UART_Transmit(&huart1, (uint8_t *)"AT+CIPCLOSE=0\r\n", 15, 100);
              HAL_Delay(500);

              // Povezovanje z LED animacijo
              Turn_Off_All_LEDs();

              uint8_t result = ESP_Connect_To_WiFi(ssid_configured, pass_configured);

              Turn_Off_All_LEDs();

              if (result == 1) {
                // ===== USPEH =====
                // 3x utripni ZELENO
                for(int i=0; i<3; i++) {
                  HAL_GPIO_WritePin(GPIOE, LD6_Pin, GPIO_PIN_SET);
                  HAL_Delay(200);
                  HAL_GPIO_WritePin(GPIOE, LD6_Pin, GPIO_PIN_RESET);
                  HAL_Delay(200);
                }
                HAL_GPIO_WritePin(GPIOE, LD6_Pin, GPIO_PIN_SET);
                HAL_Delay(1000);

                // Zapri AP server
                ESP_Send("AT+CIPSERVER=0\r\n");
                HAL_Delay(500);

                // Preklopi način
                current_mode = MODE_TCP_CLIENT;
                Turn_Off_All_LEDs();

                // Nastavi klient način
                if (esp_setup_wifi_client() == HAL_OK) {
                  esp_set_leds(1, 1, 0, 0); // AT OK, WiFi OK
                }
              } else {
                // ===== NAPAKA =====
                // 5x utripni RDEČE
                for(int i=0; i<5; i++) {
                  HAL_GPIO_WritePin(GPIOE, LD3_Pin, GPIO_PIN_SET);
                  HAL_Delay(200);
                  HAL_GPIO_WritePin(GPIOE, LD3_Pin, GPIO_PIN_RESET);
                  HAL_Delay(200);
                }

                // Nazaj v AP server mode
                Turn_Off_All_LEDs();
                HAL_Delay(500);
                ESP_Init_AP_Mode();
                HAL_GPIO_WritePin(GPIOE, LD6_Pin, GPIO_PIN_SET); // Zelena = ready
              }
            }
          }

          // 2. Zahtevek za formo
          else if (strstr(rx_data, "GET / ")) {
            sprintf(buffer, "AT+CIPSEND=0,%d\r\n", (int)strlen(html_form));
            HAL_UART_Transmit(&huart1, (uint8_t *)buffer, strlen(buffer), 100);
            HAL_Delay(100);
            HAL_UART_Transmit(&huart1, (uint8_t *)html_form, strlen(html_form), 1000);
            HAL_Delay(500);
            HAL_UART_Transmit(&huart1, (uint8_t *)"AT+CIPCLOSE=0\r\n", 15, 100);
          }
        }
      }
    }
    else if (current_mode == MODE_TCP_CLIENT)
    {
      // =========== TCP CLIENT MODE ===========

      // Branje senzorja
      LSM303DLHC_Read_Accel();
      float acc_x_g = (float)accel_x / 1000.0f;
      float acc_y_g = (float)accel_y / 1000.0f;
      float acc_z_g = (float)accel_z / 1000.0f;

      // Pošiljanje po TCP
      if (esp_open_tcp() == HAL_OK) {
        esp_set_leds(1, 1, 1, 0); // TCP OK

        char payload[128];
        snprintf(payload, sizeof(payload), "{\"x\":%.2f,\"y\":%.2f,\"z\":%.2f}\n", acc_x_g, acc_y_g, acc_z_g);

        if (esp_send_payload(payload) == HAL_OK) {
          esp_set_leds(1, 1, 1, 1); // Poslano
          HAL_Delay(200);
          esp_set_leds(1, 1, 1, 0);
        }

        esp_send_cmd("AT+CIPCLOSE\r\n", "OK", NULL, 1000);
      }
      else {
        // Reconnect logika
        HAL_GPIO_TogglePin(GPIOE, LD7_Pin);
        if(esp_send_cmd("AT+CWJAP?\r\n", ssid_configured, NULL, 1000) != ESP_RES_OK) {
          esp_setup_wifi_client();
          esp_set_leds(1, 1, 0, 0);
        }
      }

      HAL_Delay(50); // 20x/sek
    }

    /* USER CODE END WHILE */
    /* USER CODE BEGIN 3 */
  }
  /* USER CODE END 3 */
}

/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};
  RCC_PeriphCLKInitTypeDef PeriphClkInit = {0};

  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSI|RCC_OSCILLATORTYPE_HSE;
  RCC_OscInitStruct.HSEState = RCC_HSE_BYPASS;
  RCC_OscInitStruct.HSEPredivValue = RCC_HSE_PREDIV_DIV1;
  RCC_OscInitStruct.HSIState = RCC_HSI_ON;
  RCC_OscInitStruct.HSICalibrationValue = RCC_HSICALIBRATION_DEFAULT;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
  RCC_OscInitStruct.PLL.PLLMUL = RCC_PLL_MUL6;
  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK) Error_Handler();

  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK
                              |RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;
  if (HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_1) != HAL_OK) Error_Handler();

  PeriphClkInit.PeriphClockSelection = RCC_PERIPHCLK_USART1|RCC_PERIPHCLK_USART2|RCC_PERIPHCLK_I2C1;
  PeriphClkInit.Usart1ClockSelection = RCC_USART1CLKSOURCE_PCLK2;
  PeriphClkInit.Usart2ClockSelection = RCC_USART2CLKSOURCE_PCLK1;
  PeriphClkInit.I2c1ClockSelection = RCC_I2C1CLKSOURCE_HSI;
  if (HAL_RCCEx_PeriphCLKConfig(&PeriphClkInit) != HAL_OK) Error_Handler();
}

static void MX_I2C1_Init(void)
{
  hi2c1.Instance = I2C1;
  hi2c1.Init.Timing = 0x2000090E;
  hi2c1.Init.OwnAddress1 = 0;
  hi2c1.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;
  hi2c1.Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;
  hi2c1.Init.OwnAddress2 = 0;
  hi2c1.Init.OwnAddress2Masks = I2C_OA2_NOMASK;
  hi2c1.Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;
  hi2c1.Init.NoStretchMode = I2C_NOSTRETCH_DISABLE;
  if (HAL_I2C_Init(&hi2c1) != HAL_OK) Error_Handler();
  if (HAL_I2CEx_ConfigAnalogFilter(&hi2c1, I2C_ANALOGFILTER_ENABLE) != HAL_OK) Error_Handler();
  if (HAL_I2CEx_ConfigDigitalFilter(&hi2c1, 0) != HAL_OK) Error_Handler();
}

static void MX_SPI1_Init(void)
{
  hspi1.Instance = SPI1;
  hspi1.Init.Mode = SPI_MODE_MASTER;
  hspi1.Init.Direction = SPI_DIRECTION_2LINES;
  hspi1.Init.DataSize = SPI_DATASIZE_4BIT;
  hspi1.Init.CLKPolarity = SPI_POLARITY_LOW;
  hspi1.Init.CLKPhase = SPI_PHASE_1EDGE;
  hspi1.Init.NSS = SPI_NSS_SOFT;
  hspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_4;
  hspi1.Init.FirstBit = SPI_FIRSTBIT_MSB;
  hspi1.Init.TIMode = SPI_TIMODE_DISABLE;
  hspi1.Init.CRCCalculation = SPI_CRCCALCULATION_DISABLE;
  hspi1.Init.CRCPolynomial = 7;
  hspi1.Init.CRCLength = SPI_CRC_LENGTH_DATASIZE;
  hspi1.Init.NSSPMode = SPI_NSS_PULSE_ENABLE;
  if (HAL_SPI_Init(&hspi1) != HAL_OK) Error_Handler();
}

static void MX_USART1_UART_Init(void)
{
  huart1.Instance = USART1;
  huart1.Init.BaudRate = 115200;
  huart1.Init.WordLength = UART_WORDLENGTH_8B;
  huart1.Init.StopBits = UART_STOPBITS_1;
  huart1.Init.Parity = UART_PARITY_NONE;
  huart1.Init.Mode = UART_MODE_TX_RX;
  huart1.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart1.Init.OverSampling = UART_OVERSAMPLING_16;
  huart1.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart1.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart1) != HAL_OK) Error_Handler();
}

static void MX_USART2_UART_Init(void)
{
  huart2.Instance = USART2;
  huart2.Init.BaudRate = 115200;
  huart2.Init.WordLength = UART_WORDLENGTH_8B;
  huart2.Init.StopBits = UART_STOPBITS_1;
  huart2.Init.Parity = UART_PARITY_NONE;
  huart2.Init.Mode = UART_MODE_TX_RX;
  huart2.Init.HwFlowCtl = UART_HWCONTROL_NONE;
  huart2.Init.OverSampling = UART_OVERSAMPLING_16;
  huart2.Init.OneBitSampling = UART_ONE_BIT_SAMPLE_DISABLE;
  huart2.AdvancedInit.AdvFeatureInit = UART_ADVFEATURE_NO_INIT;
  if (HAL_UART_Init(&huart2) != HAL_OK) Error_Handler();
}

static void MX_GPIO_Init(void)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};

  __HAL_RCC_GPIOE_CLK_ENABLE();
  __HAL_RCC_GPIOC_CLK_ENABLE();
  __HAL_RCC_GPIOF_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOB_CLK_ENABLE();

  HAL_GPIO_WritePin(GPIOE, CS_I2C_SPI_Pin|LD4_Pin|LD3_Pin|LD5_Pin
                          |LD7_Pin|LD9_Pin|LD10_Pin|LD8_Pin
                          |LD6_Pin, GPIO_PIN_RESET);

  GPIO_InitStruct.Pin = DRDY_Pin|MEMS_INT3_Pin|MEMS_INT4_Pin|MEMS_INT1_Pin|MEMS_INT2_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_EVT_RISING;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(GPIOE, &GPIO_InitStruct);

  GPIO_InitStruct.Pin = CS_I2C_SPI_Pin|LD4_Pin|LD3_Pin|LD5_Pin
                          |LD7_Pin|LD9_Pin|LD10_Pin|LD8_Pin|LD6_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOE, &GPIO_InitStruct);

  GPIO_InitStruct.Pin = B1_Pin;
  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  HAL_GPIO_Init(B1_GPIO_Port, &GPIO_InitStruct);
}

void Error_Handler(void)
{
  __disable_irq();
  while (1) {}
}

#ifdef USE_FULL_ASSERT
void assert_failed(uint8_t *file, uint32_t line) {}
#endif
