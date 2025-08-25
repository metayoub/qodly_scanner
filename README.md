# Overview

The Qodly Scanner component is a versatile QR code scanner built using React and the `html5-qrcode` library. It allows users to scan QR codes using their device's camera and provides a seamless integration with the Qodly platform. The component supports various customization options, including frame rate, QR box size, and the ability to disable camera flipping.

![Scanner](public/scanner.png)

## Properties

| Name               | Attribute            | Type    | Default  | Description                                                                   |
| ------------------ | -------------------- | ------- | -------- | ----------------------------------------------------------------------------- |
| fps                | `fps`                | number  | 10       | The frame rate at which the camera captures frames for QR code scanning.      |
| scanOnStart        | `scanOnStart`        | boolean | false    | Whether to launch the scanner automatically on component mount.               |
| qrBoxSize          | `qrBoxSize`          | number  | 250      | The size (in px) of the box within which the QR code is scanned.              |
| disableFlip        | `disableFlip`        | boolean | false    | Whether to disable the camera flip feature (useful for front-facing cameras). |
| showLabels         | `showLabels`         | boolean | true     | Whether to show button labels (Start, Upload, Stop).                          |
| label1             | `label1`             | string  | "Start"  | Label for the "Start scanning" button.                                        |
| label2             | `label2`             | string  | "Upload" | Label for the "Upload image" button.                                          |
| label3             | `label3`             | string  | "Stop"   | Label for the "Stop scanning" button.                                         |
| allowedCodeFormats | `allowedCodeFormats` | array   | []       | Array of supported code formats (see Supported Formats).                      |

### UI Features

- **Camera selection:** If multiple cameras are available, a dropdown allows switching between them.
- **Start/Stop scanning:** Toggle camera scanning with dedicated buttons.
- **Image upload:** Scan QR/barcodes from an image file using the "Upload" button.
- **Live preview:** Shows camera or image preview in the scanner area.
- **Customizable labels:** Button labels can be customized or hidden.
- **Disabled state:** All controls can be disabled via the `disabled` prop.

### Events

The component emits the following events for integration:

- **onscansuccess**: Triggered when a code is successfully scanned.
  - Payload: `{ value: string }` (the decoded text)
- **onscanfailure**: Triggered when scanning an image file fails.
  - Payload: `{ error: string }`

## Qodly Source

| Name        | Type   | Required | Description                         |
| ----------- | ------ | -------- | ----------------------------------- |
| qodlysource | string | Yes      | Will contain the result of scanning |

## Supported Formats

| Format            | Description        |
| ----------------- | ------------------ |
| QR_CODE           | QR Code            |
| AZTEC             | Aztec Code         |
| CODABAR           | Codabar            |
| CODE_39           | Code 39            |
| CODE_93           | Code 93            |
| CODE_128          | Code 128           |
| DATA_MATRIX       | Data Matrix        |
| MAXICODE          | MaxiCode           |
| ITF               | Interleaved 2 of 5 |
| EAN_13            | EAN-13             |
| EAN_8             | EAN-8              |
| PDF_417           | PDF417             |
| RSS_14            | RSS-14             |
| RSS_EXPANDED      | RSS Expanded       |
| UPC_A             | UPC-A              |
| UPC_E             | UPC-E              |
| UPC_EAN_EXTENSION | UPC/EAN Extension  |
