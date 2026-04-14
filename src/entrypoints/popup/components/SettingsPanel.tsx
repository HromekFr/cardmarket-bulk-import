import { i18n } from '#imports';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button, Form, Stack } from 'react-bootstrap';

import Panel from './panels-context/Panel';
import { getSettings, saveSettings } from '../../../utils/settings';
import type { Settings } from '../../../utils/settings';

const schema = yup.object({
  priceFloor: yup.number().min(0).required(),
  submissionDelay: yup.number().min(0).integer().required(),
});

function SettingsPanel() {
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Settings>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    getSettings().then((s) => reset(s));
  }, [reset]);

  async function onSubmit(values: Settings) {
    await saveSettings(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Panel title={i18n.t('popup.panels.settings.title')}>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap={3} className="mt-2">
          <Form.Group>
            <Form.Label>{i18n.t('popup.panels.settings.priceFloor')}</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              isInvalid={!!errors.priceFloor}
              {...register('priceFloor', { valueAsNumber: true })}
            />
            <Form.Control.Feedback type="invalid">
              {errors.priceFloor?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group>
            <Form.Label>{i18n.t('popup.panels.settings.submissionDelay')}</Form.Label>
            <Form.Control
              type="number"
              step="1"
              isInvalid={!!errors.submissionDelay}
              {...register('submissionDelay', { valueAsNumber: true })}
            />
            <Form.Control.Feedback type="invalid">
              {errors.submissionDelay?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Button type="submit" variant={saved ? 'success' : 'primary'}>
            {saved ? i18n.t('popup.panels.settings.saved') : i18n.t('popup.panels.settings.save')}
          </Button>
        </Stack>
      </Form>
    </Panel>
  );
}

export default SettingsPanel;
