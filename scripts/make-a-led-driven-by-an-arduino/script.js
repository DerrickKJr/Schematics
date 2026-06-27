eda.sys_MessageBox.showConfirmationMessage(
  'Build LED Driver schematic?\n\nArduino Pin 13 → R1 (220Ω) → LED1 → GND',
  'LED Driver Script',
  'Build',
  'Cancel',
  async function(confirmed) {
    if (!confirmed) {
      eda.sys_ToastMessage.showMessage('Cancelled.', 2);
      return;
    }

    try {
      eda.sys_ToastMessage.showMessage('Fetching parts from library...', 3);

      // Fetch parts: C58678 = 220Ω resistor, C84256 = LED
      const devices = await eda.lib_Device.getByLcscIds(['C58678', 'C84256']);

      const r1Part = devices.find(d =>
        (d.supplierId === 'C58678') ||
        (d.otherProperty && d.otherProperty['Supplier Part'] === 'C58678')
      );

      const ledPart = devices.find(d =>
        (d.supplierId === 'C84256') ||
        (d.otherProperty && d.otherProperty['Supplier Part'] === 'C84256')
      );

      if (!r1Part) throw new Error('Could not find resistor C58678 in library.');
      if (!ledPart) throw new Error('Could not find LED C84256 in library.');

      eda.sys_ToastMessage.showMessage('Parts found. Placing schematic...', 3);

      // ---------------------------------------------------------------
      // Layout plan (all units × 100 = EasyEDA internal units, inches×100)
      //
      //  X = 400 (vertical chain)
      //
      //  VCC-like net flag "PWR" at top representing Arduino Pin 13
      //  We'll use a VCC flag labelled as a net named "PIN13"
      //  Actually: use a plain VCC flag at top, label net "PIN13"
      //
      //  Y positions (Y increases upward):
      //    VCC flag (PIN13 net):  Y = 700
      //    Wire: 700 → 620
      //    R1 centre:             Y = 600  (pins at 620 top, 580 bottom)
      //    Wire: 580 → 500
      //    LED1 centre:           Y = 480  (pins at 500 anode, 460 cathode)
      //    Wire: 460 → 380
      //    GND flag:              Y = 380
      // ---------------------------------------------------------------

      const X = 400;

      // Place VCC net flag at top (represents Arduino Pin 13 output)
      // We use a custom net name "PIN13" to represent the Arduino GPIO
      await eda.sch_PrimitiveComponent.createNetFlag('Power', 'PIN13', X, 700, 0, false);
      eda.sys_ToastMessage.showMessage('Placed PIN13 power flag.', 2);

      // Wire from PIN13 flag down to R1 top pin
      await eda.sch_PrimitiveWire.create([X, 700, X, 620]);

      // Place R1 (220Ω) — vertical, centre at Y=600
      // rotation=90 makes it vertical; pins at Y+20=620 (top) and Y-20=580 (bottom)
      await eda.sch_PrimitiveComponent.create(r1Part, X, 600, '', 90, false, true, true);
      eda.sys_ToastMessage.showMessage('Placed R1 (220Ω).', 2);

      // Wire from R1 bottom pin down to LED1 anode
      await eda.sch_PrimitiveWire.create([X, 580, X, 500]);

      // Place LED1 — vertical, centre at Y=480
      // pins at Y+20=500 (anode) and Y-20=460 (cathode)
      await eda.sch_PrimitiveComponent.create(ledPart, X, 480, '', 90, false, true, true);
      eda.sys_ToastMessage.showMessage('Placed LED1.', 2);

      // Wire from LED1 cathode down to GND flag
      await eda.sch_PrimitiveWire.create([X, 460, X, 380]);

      // Place GND flag at bottom
      await eda.sch_PrimitiveComponent.createNetFlag('Ground', 'GND', X, 380, 0, false);
      eda.sys_ToastMessage.showMessage('Placed GND flag.', 2);

      // Save the schematic
      await eda.sch_Document.save();

      eda.sys_ToastMessage.showMessage(
        'LED Driver schematic built and saved successfully!', 4
      );

    } catch (e) {
      eda.sys_MessageBox.showInformationMessage(
        'Script Error:\n' + e.message + '\n\n' + e.stack,
        'LED Driver Script Error'
      );
    }
  }
);