from django.db import migrations


def update_texts(apps, schema_editor):
    SecretQuestion = apps.get_model("accounts", "SecretQuestion")
    updates = [
        (1, "Kāds bija jūsu pirmā mājdzīvnieka vārds?"),
        (2, "Kāda ir jūsu mammas meitas uzvārds?"),
        (3, "Kāds bija jūsu pirmās skolas nosaukums?"),
        (4, "Kurā pilsētā jūs piedzimāt?"),
        (5, "Kāda ir jūsu mīļākā grāmata bērnībā?"),
        (6, "Kāds bija jūsu pirmais auto?"),
        (7, "Kurš ir jūsu mīļākais skolotājs?"),
        (8, "Kāds ir jūsu mīļākais sporta klubs?"),
        (9, "Kāds bija jūsu pirmā darba devēja nosaukums?"),
        (10, "Kāds ir jūsu mīļākais brīvdienu galamērķis?"),
    ]
    for pk, text in updates:
        try:
            q = SecretQuestion.objects.get(pk=pk)
            q.text = text
            q.save(update_fields=["text"])
        except SecretQuestion.DoesNotExist:
            SecretQuestion.objects.create(id=pk, text=text, is_active=True)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_secret_questions'),
    ]

    operations = [
        migrations.RunPython(update_texts, migrations.RunPython.noop),
    ]
